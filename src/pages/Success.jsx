import { Zap, CheckCircle } from 'lucide-react';
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
  return <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-yellow-400 selection:text-black">
    <div className="relative w-full max-w-md bg-white text-black border-4 border-black rounded-3xl p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] flex flex-col gap-6">
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><Zap size={28} aria-hidden="true" /></div>
    <h1 className="mt-6 text-3xl font-black uppercase tracking-tighter">{active ? 'Assinatura ativa' : 'Aguardando ativação'}</h1>
    <p role="status">{active ? `Seu plano ${subscription.plan_type.toUpperCase()} está disponível.` :
      !user ? 'Entre na sua conta para consultar a assinatura.' : waiting ? 'Estamos consultando a confirmação da assinatura…' :
      'A confirmação ainda não chegou. Não pague novamente. Consulte sua conta em alguns minutos ou fale com o atendimento.'}</p>
    {active && <ul className="bg-gray-50 border-2 border-gray-100 rounded-xl p-5 text-left space-y-4 font-black text-xs uppercase tracking-wider">
      {['Repertórios ilimitados', 'Colaboração e compartilhamento', ...(subscription.plan_type === 'pro' ? ['Editor de timecode'] : [])].map(benefit => <li key={benefit} className="flex items-center gap-3"><CheckCircle size={18} className="text-green-500 shrink-0" aria-hidden="true" />{benefit}</li>)}
    </ul>}
    <Link to={user ? '/' : '/login'} className="w-full py-4 bg-yellow-400 text-black border-2 border-black rounded-xl font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all">{user ? 'Ir para meus repertórios' : 'Entrar'}</Link>
    </div>
  </main>;
}
