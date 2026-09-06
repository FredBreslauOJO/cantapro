import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// SUBSTITUA ESTES IDs PELOS PRICE IDs DOS SEUS PRODUTOS REAIS NO STRIPE
const PLAN_PRICE_IDS = {
  BASE: 'price_XXXXX_base', 
  PRO: 'price_XXXXX_pro'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.payment_status === 'paid') {
        const customerEmail = session.customer_details?.email;
        
        // IDENTIFICAÇÃO CORRETA PELO ID DO PRODUTO (NÃO PELO VALOR PAGO)
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        let planType = 'free';
        if (priceId === PLAN_PRICE_IDS.BASE) planType = 'base';
        if (priceId === PLAN_PRICE_IDS.PRO) planType = 'pro';

        if (customerEmail) {
          await supabase.from('user_subscriptions').upsert({
            user_email: customerEmail,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_type: planType,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_email' });
        }
      }
    }

    // TRATAMENTO DE CANCELAMENTO OU INADIMPLÊNCIA
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const status = subscription.status; 
      const customerId = subscription.customer;

      if (status === 'canceled' || status === 'unpaid') {
        await supabase.from('user_subscriptions')
          .update({ plan_type: 'free', status: status, updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Database update failed' });
  }
}