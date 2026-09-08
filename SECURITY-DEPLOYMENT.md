# CANTA.PRO — implantação das melhorias de segurança

Esta branch contém as correções de isolamento de contas, RLS, limites de plano, convites, cobrança, PWA offline e acessibilidade.

## Antes de publicar

1. Faça backup do Supabase e aplique `supabase/migrations/202609060001_audit_hardening.sql` primeiro em um projeto de staging.
2. A migração aborta de propósito se houver músicas, repertórios ou convites cujo e-mail antigo não possa ser ligado a `auth.users`, ou se houver clientes/assinaturas Stripe duplicados. Resolva esses dados antes de tentar novamente.
3. Confirme no staging que o usuário Free não cria a 11ª música, que Base e Pro permanecem ilimitados, que um convidado Free pode ler mas não editar e que assinaturas não podem ser alteradas pelo cliente.

## Variáveis

Use `.env.example` como referência. `VITE_SUPABASE_*` pode chegar ao navegador; `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` são exclusivos das funções da Vercel. Nunca os coloque em código, no Git ou em variáveis com prefixo `VITE_`.

Configure no ambiente de produção: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `APP_URL=https://app.canta.pro`. Os Price IDs reais já estão definidos para Base (R$4,99) e Pro (R$7,99); em staging, substitua-os pelos preços de teste correspondentes.

## Stripe

Cadastre o endpoint `/api/webhook` e habilite `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`. Clientes antigos precisam ter `stripe_customer_id` e `stripe_subscription_id` conferidos e associados ao UUID correto antes de qualquer nova compra.

## Limites conhecidos

O conteúdo offline já baixado não pode ser revogado remotamente enquanto permanecer no dispositivo; o logout limpa os caches privados locais. A primeira atualização da PWA pode aguardar o fechamento e reabertura do app. Assinaturas em `past_due` passam a Free imediatamente; a política é definida em `subscriptionPlan`, em `server/billing.js`, e deve ser ajustada e testada se o negócio exigir carência.

Execute `npm ci`, `npm run lint`, `npm test` e `npm run build` antes de publicar. A migração é uma operação de banco separada do deploy da Vercel e não foi executada automaticamente por esta branch.
