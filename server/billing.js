import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
export const PRICES = {
  base: process.env.STRIPE_BASE_PRICE_ID || 'price_1TnOE2GutIbUzoXGLcIIC1L4',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1TiJHhGutIbUzoXGiv6xZ4sT',
};
export function clients() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Billing configuration missing');
  return { stripe: new Stripe(process.env.STRIPE_SECRET_KEY),
    db: createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }) };
}
export async function authenticatedUser(req, db) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error('Faça login novamente.');
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error('Faça login novamente.');
  return data.user;
}
export function appUrl() {
  const url = new URL(process.env.APP_URL || 'https://www.canta.pro');
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('Invalid APP_URL');
  return url.origin;
}
export function subscriptionPlan(subscription, prices = PRICES) {
  const items = subscription.items?.data || [];
  if (items.length !== 1) throw new Error('Unexpected subscription products');
  const plan = Object.keys(prices).find(key => prices[key] === items[0].price.id);
  if (!plan) throw new Error('Unknown Stripe Price ID');
  if (subscription.status === 'trialing') return plan;
  if (subscription.status !== 'active') return 'free';
  // Active subscriptions can still have an asynchronous first payment in flight.
  return subscription.latest_invoice?.status === 'paid' ? plan : 'free';
}
