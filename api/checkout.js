import { clients, authenticatedUser, appUrl, PRICES } from '../server/billing.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const { stripe, db } = clients();
    let user;
    try { user = await authenticatedUser(req, db); } catch { return res.status(401).json({ error: 'Faça login novamente.' }); }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!Object.hasOwn(PRICES, body?.plan)) return res.status(400).json({ error: 'Plano inválido.' });
    const { data: existing, error } = await db.from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    let customer = existing?.stripe_customer_id;
    if (!customer && (existing?.stripe_subscription_id || ['base', 'pro'].includes(existing?.plan_type))) {
      return res.status(409).json({ error: 'Sua assinatura anterior precisa ser vinculada à conta. Contate o suporte antes de fazer outra compra.' });
    }
    if (!customer) {
      const created = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } }, { idempotencyKey: `canta-customer-${user.id}` });
      customer = created.id;
      const { error: saveError } = await db.from('user_subscriptions').upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: 'user_id' });
      if (saveError) throw saveError;
    }
    const current = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 });
    if (current.has_more || current.data.some(sub => !['canceled', 'incomplete_expired'].includes(sub.status))) {
      return res.status(409).json({ error: 'Você já tem uma assinatura. Use Gerenciar assinatura para alterar o plano.' });
    }
    const { data: attempt, error: claimError } = await db.rpc('claim_checkout', { p_user_id: user.id, p_plan: body.plan });
    if (claimError) return res.status(409).json({ error: 'Já existe uma tentativa de assinatura em andamento. Aguarde até 35 minutos ou conclua o checkout aberto.' });
    if (attempt.session_id) {
      const pending = await stripe.checkout.sessions.retrieve(attempt.session_id);
      if (pending.status === 'open') return res.status(200).json({ url: pending.url });
      return res.status(409).json({ error: 'Este checkout foi concluído ou expirou. Consulte sua assinatura antes de tentar novamente.' });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', customer, client_reference_id: user.id,
      line_items: [{ price: PRICES[body.plan], quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } }, metadata: { user_id: user.id },
      allow_promotion_codes: true, locale: 'pt-BR',
      expires_at: Math.floor(new Date(attempt.expires_at).getTime() / 1000),
      success_url: `${appUrl()}/sucesso`, cancel_url: `${appUrl()}/`,
    }, { idempotencyKey: `canta-checkout-${attempt.request_id}` });
    const { error: persistError } = await db.from('billing_checkout_attempts').update({ session_id: session.id, session_url: session.url })
      .eq('user_id', user.id).eq('request_id', attempt.request_id);
    if (persistError) throw persistError;
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Checkout failed', error.message);
    return res.status(500).json({ error: 'Não foi possível iniciar a assinatura. Tente novamente.' });
  }
}
