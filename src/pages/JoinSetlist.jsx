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
  return <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-6">
    <h1 className="text-3xl font-black">Convite para repertório</h1>
    <p>Ao aceitar, o repertório será adicionado à sua conta. O acesso será validado antes de abrir o conteúdo.</p>
    {!token ? <p role="alert">Este link antigo não é mais válido. Peça ao dono um novo convite.</p> : !user ?
      <Link to="/login" onClick={() => sessionStorage.setItem('canta_invite_redirect', window.location.pathname + window.location.search)} className="p-4 bg-black text-white rounded-xl">Entrar para aceitar</Link> :
      <button onClick={accept} disabled={joining} className="p-4 bg-black text-white rounded-xl">{joining ? 'Validando…' : 'Aceitar convite'}</button>}
    {error && <p role="alert">{error}</p>}
    <Link to="/">Voltar</Link>
  </main>;
}
