import { Music } from 'lucide-react';
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { invalidateContent } from '../lib/userCache';
export default function JoinSetlist() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const token = params.get('token');
  const accept = async () => {
    setJoining(true);
    setError('');
    const { error: failure } = await supabase.rpc('accept_setlist_invite', { p_setlist_id: id, p_token: token });
    if (failure) { setError(failure.message); setJoining(false); return; }
    invalidateContent(user.id);
    sessionStorage.removeItem('canta_invite_redirect');
    navigate(`/setlists/${id}/edit`);
  };
  if (isLoadingAuth) return <p role="status">Preparando convite…</p>;
  return <main className="relative overflow-hidden min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-yellow-400 selection:text-black">
    <video autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-40"><source src="/videoBG/loginVid.webm" type="video/webm" /></video>
    <div className="relative w-full max-w-md bg-white text-black border-4 border-black rounded-3xl p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] flex flex-col gap-6">
    <div className="w-16 h-16 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Music size={28} aria-hidden="true" /></div>
    <h1 className="text-3xl font-black uppercase tracking-tighter">Convite para repertório</h1>
    <p>Ao aceitar, o repertório será adicionado à sua conta. O acesso será validado antes de abrir o conteúdo.</p>
    {!token ? <p role="alert">Este link antigo não é mais válido. Peça ao dono um novo convite.</p> : !user ?
      <Link to="/login" onClick={() => sessionStorage.setItem('canta_invite_redirect', window.location.pathname + window.location.search)} className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all disabled:opacity-50">Entrar para aceitar</Link> :
      <button onClick={accept} disabled={joining} className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all disabled:opacity-50">{joining ? 'Validando…' : 'Aceitar convite'}</button>}
    {error && <p role="alert">{error}</p>}
    <Link to="/" className="py-4 text-black/40 hover:text-black font-black uppercase tracking-widest text-xs">Agora não</Link>
    </div>
  </main>;
}
