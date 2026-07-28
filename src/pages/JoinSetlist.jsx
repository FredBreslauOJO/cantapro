import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Music, CheckCircle2, X } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

export default function JoinSetlist() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Pegamos o PLANO do usuário para aplicar a trava
  const { user, plan } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Puxa os dados direto do Link (Bypassa a segurança do Supabase)
  const setlistName = searchParams.get('n') || "REPERTÓRIO COMPARTILHADO";
  const invitedBy = searchParams.get('by') || "SUA BANDA";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Salva a URL completa (incluindo as variáveis ?n= e by=)
        localStorage.setItem('canta_invite_redirect', window.location.pathname + window.location.search);
        navigate('/login'); 
        return;
      }

      setLoading(false); // Já está logado? Libera a tela na hora!
    };

    checkAuth();
  }, [id, navigate]);

  const handleAcceptInvite = async () => {
    setJoining(true);
    setError('');

    try {
      // 1. APLICAÇÃO DO LIMITE DO PLANO FREE
      const currentPlan = plan || 'free';
      
      if (currentPlan === 'free') {
        const { count: ownedCount } = await supabase
          .from('setlists')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.email);

        const { count: collabCount } = await supabase
          .from('setlist_members')
          .select('*', { count: 'exact', head: true })
          .eq('member_email', user.email);

        // Verifica se o usuário já não é o dono ou já é membro DESTE setlist específico
        // (Para não bloquear injustamente caso ele clique no link de novo sem querer)
        const { count: isAlreadyMember } = await supabase
          .from('setlist_members')
          .select('*', { count: 'exact', head: true })
          .match({ setlist_id: id, member_email: user.email });
          
        const { count: isOwner } = await supabase
          .from('setlists')
          .select('*', { count: 'exact', head: true })
          .match({ id: id, created_by: user.email });

        const totalSetlists = (ownedCount || 0) + (collabCount || 0);

        if (!isAlreadyMember && !isOwner && totalSetlists >= 1) {
          setError("Limite Atingido! Usuários no plano FREE podem participar de apenas 1 repertório. Exclua ou saia do seu repertório atual, ou faça upgrade para aceitar este convite.");
          setJoining(false);
          return;
        }
      }

      // 2. INSERE O USUÁRIO NA COLABORAÇÃO
      const { error: insertError } = await supabase
        .from('setlist_members')
        .insert({ setlist_id: id, member_email: user.email });

      // Se der erro de duplicação (ele já clicou antes), nós ignoramos e deixamos ele entrar
      if (insertError && !insertError.message.includes('duplicate')) {
        throw insertError;
      }

      // Limpa a memória e manda pra Home!
      localStorage.removeItem('canta_invite_redirect');
      navigate('/');
      
    } catch (err) {
      setError("Não foi possível entrar nesta playlist. O link pode ser muito antigo.");
      setJoining(false);
    }
  };

  if (!user) return null; 
  if (loading) return <LoadingScreen message="Preparando convite..." />;

  // TELA DE ERRO SE ALGO DER MUITO ERRADO NO INSERT OU BATER NO LIMITE DO FREE
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <X size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight mb-2">Atenção</h2>
        <p className="text-sm font-bold text-gray-500 max-w-sm">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-8 px-6 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  // TELA DE CONVITE (SUCESSO)
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      <video autoPlay muted loop playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-40">
        <source src="/videoBG/loginVid.webm" type="video/webm" />
      </video>
      
      <div className="relative z-10 w-full max-w-md bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)]">
        <div className="w-16 h-16 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Music size={28} className="text-black" />
        </div>
        
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Convite para Banda</h2>
        <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">
          <span className="text-black font-black">{invitedBy}</span> convidou você para colaborar no repertório:
        </p>
        
        <div className="bg-gray-50 border-2 border-black rounded-xl p-4 mb-8">
          <p className="font-black text-lg uppercase tracking-tight text-black truncate">{setlistName}</p>
        </div>

        <button 
          onClick={handleAcceptInvite}
          disabled={joining}
          className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
        >
          {joining ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Aceitar Convite</>}
        </button>
        
        <button 
          onClick={() => navigate('/')}
          className="w-full mt-3 py-4 bg-transparent text-black/40 hover:text-black rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}