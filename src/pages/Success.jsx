import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
export default function Success() {
  const { user, subscription, refreshUserData } = useAuth();
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    void refreshUserData();
    const interval = setInterval(() => { void refreshUserData(); }, 3000);
    const timeout = setTimeout(() => { clearInterval(interval); setWaiting(false); }, 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [refreshUserData]);
  const active = ['active','trialing'].includes(subscription?.status) && ['base','pro'].includes(subscription?.plan_type);
  return <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-6">
    <h1 className="text-3xl font-black">{active ? 'Assinatura ativa' : 'Aguardando ativação'}</h1>
    <p role="status">{active ? `Seu plano ${subscription.plan_type.toUpperCase()} está disponível.` :
      !user ? 'Entre na sua conta para consultar a assinatura.' : waiting ? 'Estamos consultando a confirmação da assinatura…' :
      'A confirmação ainda não chegou. Não pague novamente. Consulte sua conta em alguns minutos ou fale com o atendimento.'}</p>
    <Link to={user ? '/' : '/login'} className="rounded-xl bg-black text-white p-4">{user ? 'Ir para meus repertórios' : 'Entrar'}</Link>
  </main>;
}
