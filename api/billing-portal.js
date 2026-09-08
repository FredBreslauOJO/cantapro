import { clients, authenticatedUser, appUrl } from '../server/billing.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { stripe, db } = clients();
    let user;
    try { user = await authenticatedUser(req, db); } catch { return res.status(401).json({ error: 'Faça login novamente.' }); }
    const { data, error } = await db.from('user_subscriptions').select('stripe_customer_id').eq('user_id', user.id).single();
    if (error || !data?.stripe_customer_id) return res.status(409).json({ error: 'Assinatura não vinculada. Entre em contato com o atendimento.' });
    const portal = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: appUrl() });
    return res.status(200).json({ url: portal.url });
  } catch { return res.status(500).json({ error: 'Não foi possível abrir o gerenciamento da assinatura.' }); }
}
