import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// No Vercel, precisamos desativar o "leitor de corpo" padrão para o Stripe poder validar a assinatura de segurança
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para ler o corpo bruto (raw) da requisição
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Inicializa as conexões usando as senhas secretas que vamos configurar na Vercel depois
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Se alguém tentar acessar a URL direto no navegador (método GET), a gente bloqueia. Só o Stripe (POST) pode entrar.
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Essa é a checagem de segurança do Stripe. Ele confere se a mensagem realmente veio do Stripe ou se é um hacker forjando.
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Erro na assinatura do Webhook:', err.message);
    return res.status(400).send(`Erro no Webhook: ${err.message}`);
  }

  // O único evento que nos interessa: O pagamento foi concluído com sucesso
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Pegamos o e-mail que foi preenchido lá no Stripe
    const customerEmail = session.customer_details?.email;
    const amountPaid = session.amount_total; // O Stripe conta em centavos (ex: 1099 = R$ 10,99)

    if (customerEmail) {
      // Descobre se ele pagou o Base (R$6,99 / R$7,00) ou o Pro (R$10,99 / R$10,00)
      let newPlan = 'free';
      if (amountPaid >= 1000) {
        newPlan = 'pro';
      } else if (amountPaid >= 600) {
        newPlan = 'base';
      }

      // Invade o banco de dados usando a chave mestra e a coluna correta (user_email)
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ plan_type: newPlan })
        .eq('user_email', customerEmail); 

      if (error) {
        console.error('❌ Erro ao atualizar plano no Supabase:', error);
        return res.status(500).json({ error: 'Falha ao atualizar banco de dados' });
      }
      
      console.log(`✅ Sucesso! O usuário ${customerEmail} agora é ${newPlan.toUpperCase()}`);
    }
  }

  // AVISA O STRIPE QUE RECEBEMOS O PACOTE (Para ele não tentar reenviar)
  res.status(200).json({ received: true });
}