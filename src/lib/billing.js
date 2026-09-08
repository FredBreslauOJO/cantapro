import { supabase } from './supabase';
export async function openBilling(endpoint, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Faça login novamente.');
  const response = await fetch(`/api/${endpoint}`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível abrir a assinatura.');
  const target = new URL(result.url);
  if (target.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(target.hostname)) throw new Error('Destino de cobrança inválido.');
  window.location.assign(target.href);
}
