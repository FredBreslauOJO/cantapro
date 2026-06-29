import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Trash2, Search, 
  Eye, Music, Plus, Calendar 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SetlistEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); // Pega o ID único do setlist vindo da URL
  const { user } = useAuth();

  // Estados limpos aguardando os dados reais do banco
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyAdded, setShowOnlyAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("selecionar");
  const [allSongs, setAllSongs] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      loadSetlistData();
    }
  }, [user, id]);

  // Carrega as informações específicas do setlist clicado
  const loadSetlistData = async () => {
    try {
      setLoading(true);

      // 1. Busca os dados do Setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', id)
        .single();

      if (setlistError) throw setlistError;

      if (setlist) {
        setTitle(setlist.title || "SEM TÍTULO");
        setEvent(setlist.event_name || ""); // Ajuste para a coluna real do seu banco (ex: event_name ou description)
        
        // Formata a data se houver
        if (setlist.created_at) {
          const formattedDate = new Date(setlist.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          setDate(formattedDate);
        }
      }

      // 2. Busca as músicas associadas a este setlist (tabela intermediária setlist_members)
      const { data: members, error: membersError } = await supabase
        .from('setlist_members')
        .select('*')
        .eq('setlist_id', id);

      if (membersError) throw membersError;
      
      // Armazena as músicas vinculadas para renderizar a lista ou o aviso de vazio
      if (members) {
        setAllSongs(members);
      }

    } catch (err) {
      console.error("Erro ao carregar dados do setlist:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-xs tracking-widest text-black">
        Carregando Setlist...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans select-none text-black">
      
      <div className="p-4 max-w-xl mx-auto">
        
        {/* 1. BOTÕES DE AÇÃO SUPERIORES */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:scale-95 transition-all">
              <Printer size={18} />
            </button>
            <button className="p-2.5 bg-yellow-200 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-100 active:scale-95 transition-all">
              <Share2 size={18} />
            </button>
            <button className="p-2.5 bg-white border-2 border-black text-red-500 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 active:scale-95 transition-all">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* 2. TÍTULO E NOME DO SHOW DINÂMICOS */}
        <div className="mb-4">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-black text-3xl uppercase tracking-tighter outline-none border-b-4 border-black pb-1 placeholder-black/20"
            placeholder="NOME DO SETLIST"
          />
        </div>

        <div className="mb-4">
          <input 
            type="text" 
            value={event} 
            onChange={(e) => setEvent(e.target.value)}
            className="w-full px-3 py-2.5 font-bold uppercase tracking-wide text-sm bg-transparent border-2 border-gray-300 rounded-xl focus:border-black outline-none transition-colors"
            placeholder="NOME DA BANDA OU EVENTO"
          />
        </div>

        {/* 3. DATA DO SHOW */}
        <div className="flex items-center gap-2 mb-6 text-xs font-bold text-black/60 uppercase tracking-wider">
          <span>Data do Show:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-300 rounded-lg text-black font-medium normal-case">
            <Calendar size={12} className="text-black/40" />
            {date || "Sem data"}
          </div>
        </div>

        {/* 4. ABAS: SELECIONAR / ORDENAR */}
        <div className="w-full border-2 border-black rounded-xl p-1 flex bg-white mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <button 
            onClick={() => setActiveTab("selecionar")}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'selecionar' ? 'bg-black text-white' : 'bg-transparent text-black'}`}
          >
            Selecionar
          </button>
          <button 
            onClick={() => setActiveTab("ordenar")}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'ordenar' ? 'bg-black text-white' : 'bg-transparent text-black'}`}
          >
            Ordenar
          </button>
        </div>

        {/* 5. BUSCA LOCAL */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar músicas do setlist..." 
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-300 focus:border-black outline-none rounded-xl text-sm font-medium transition-colors"
          />
        </div>

        <div 
          onClick={() => setShowOnlyAdded(!showOnlyAdded)}
          className="flex items-center gap-2 text-xs font-bold text-black cursor-pointer mb-6"
        >
          <div className={`w-4 h-4 border-2 border-black rounded flex items-center justify-center transition-colors ${showOnlyAdded ? 'bg-black text-white' : 'bg-white'}`}>
            {showOnlyAdded && <Plus size={10} strokeWidth={4} />}
          </div>
          <Eye size={14} className="text-black/60" />
          <span>Somente adicionadas</span>
        </div>

        {/* 6. RENDERIZAÇÃO DE CONTEÚDO / AVISO REPERTÓRIO VAZIO */}
        <div className="mt-4">
          {allSongs.length === 0 ? (
            <div className="border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 my-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Music size={22} />
              </div>
              <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu repertório está vazio</h3>
              <p className="text-xs font-bold text-black/60 mb-6 leading-relaxed max-w-xs mx-auto">
                Para montar um setlist, você precisa criar as suas músicas primeiro no menu Letras.
              </p>
              <button 
                onClick={() => navigate('/songs')} 
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 active:scale-95 transition-all shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]"
              >
                <Plus size={14} strokeWidth={3} /> Crie uma nova letra
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {allSongs
                .filter(song => (song.member_email || "").toLowerCase().includes(searchQuery.toLowerCase()))
                .map((song) => (
                  <div key={song.id} className="p-4 border-2 border-black rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-bold text-sm uppercase">{song.member_email || "Música sem identificação"}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>

      {/* 7. BOTTOM NAVIGATION FIXED */}
      <nav className="fixed bottom-0 left-0 right-0 border-t-4 border-black bg-white px-4 py-3 flex gap-3 z-50">
        <button 
          onClick={() => navigate('/')}
          className="flex-1 py-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
        >
          Setlists
        </button>
        <button 
          onClick={() => navigate('/songs')}
          className="flex-1 py-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all"
        >
          <Music size={14} /> Letras
        </button>
      </nav>

    </div>
  );
}