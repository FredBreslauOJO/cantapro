import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicializa Stripe e Supabase (usando a chave de Admin/Service Role para burlar o RLS de forma segura via backend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Valida a assinatura do Stripe para garantir que a requisição é legítima
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 1. TRATAR NOVO PAGAMENTO CONCLUÍDO
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Se for boleto/PIX e ainda não estiver pago, ignora por enquanto.
      if (session.payment_status !== 'paid') {
         return res.status(200).json({ received: true, status: 'unpaid_ignored' });
      }

      const customerEmail = session.customer_details?.email;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      // Definir plano com base no valor pago (Correção da Auditoria: 4,99 Base / 7,99 Pro)
      // O ideal no futuro é checar pelo metadata ou Price ID do produto.
      const amountTotal = session.amount_total;
      let planType = 'free';
      
      if (amountTotal >= 799) {
        planType = 'pro';
      } else if (amountTotal >= 499) {
        planType = 'base';
      }

      // Buscar o ID do usuário no Supabase através do e-mail
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (user && !userError) {
        await supabase.from('user_subscriptions').upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          plan_type: planType,
          status: 'active',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }

    // 2. TRATAR CANCELAMENTO OU INADIMPLÊNCIA (Adição pós-auditoria)
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const status = subscription.status; // Pode ser 'active', 'past_due', 'canceled', 'unpaid'
      
      if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
         await supabase.from('user_subscriptions').update({
            plan_type: 'free',
            status: status,
            updated_at: new Date().toISOString()
         }).eq('stripe_subscription_id', subscription.id);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro interno no Webhook:", error);
    res.status(500).json({ error: 'Database update failed' });
  }
}