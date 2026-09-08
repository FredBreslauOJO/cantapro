import { clients, subscriptionPlan } from '../server/billing.js';
export const config = { api: { bodyParser: false } };
const relevant = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'invoice.paid', 'invoice.payment_failed']);
export async function processEvent(event, stripe, db) {
  if (!relevant.has(event.type)) return;
  const object = event.data.object;
  if (event.type.startsWith('checkout.session.') && !['paid','no_payment_required'].includes(object.payment_status)) return;
  let id = event.type.startsWith('customer.subscription.') ? object.id :
    object.subscription || object.parent?.subscription_details?.subscription;
  if (typeof id === 'object') id = id.id;
  if (!id) return;
  // Retrieve current state instead of applying an outdated webhook payload.
  const sub = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] });
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = sub.metadata?.user_id;
  const { data: linked, error } = await db.from('user_subscriptions').select('user_id,stripe_subscription_id')
    .eq('stripe_customer_id', customer).maybeSingle();
  if (error) throw new Error(error.message);
  if (linked && userId && linked.user_id !== userId) throw new Error('Subscription account mismatch');
  userId ||= linked?.user_id;
  if (!userId) throw new Error('Subscription has no verified account mapping');
  if (linked?.stripe_subscription_id && linked.stripe_subscription_id !== sub.id) {
    const previous = await stripe.subscriptions.retrieve(linked.stripe_subscription_id);
    if (!['canceled','incomplete_expired'].includes(previous.status)) throw new Error('Multiple subscriptions require reconciliation');
    // An old canceled subscription must never downgrade its replacement.
    if (['canceled','incomplete_expired'].includes(sub.status)) return;
  }
  const plan = subscriptionPlan(sub);
  const period = sub.current_period_end || sub.items.data[0]?.current_period_end;
  const { error: saveError } = await db.rpc('apply_stripe_subscription', {
    p_event_id: event.id, p_created: event.created, p_user_id: userId, p_customer: customer,
    p_subscription: sub.id, p_plan: plan, p_status: sub.status,
    p_period_end: period ? new Date(period * 1000).toISOString() : null,
  });
  if (saveError) throw new Error(saveError.message);
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let stripe, db, event;
  try {
    ({ stripe, db } = clients());
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Missing webhook secret');
  } catch (error) {
    console.error('Webhook configuration', error.message);
    return res.status(500).json({ error: 'Webhook indisponível.' });
  }
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > 1024 * 1024) return res.status(413).end();
      chunks.push(bytes);
    }
    event = stripe.webhooks.constructEvent(Buffer.concat(chunks), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return res.status(400).json({ error: 'Assinatura inválida.' }); }
  try {
    await processEvent(event, stripe, db);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook failed', event.id, error.message);
    return res.status(500).json({ error: 'Falha ao reconciliar assinatura.' });
  }
}
