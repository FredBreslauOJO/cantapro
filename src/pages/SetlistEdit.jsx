import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Trash2, Search, 
  Music, Plus, Minus, Calendar, GripVertical 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SetlistEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const { user } = useAuth();

  // Estados do Setlist
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados de Gerenciamento de Músicas
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySongs, setLibrarySongs] = useState([]); 
  const [addedSongs, setAddedSongs] = useState([]);     
  const [activeTab, setActiveTab] = useState("selecionar"); 
  
  // Estado para controlar o índice do card sendo arrastado
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (user && id) {
      loadSetlistAndLibrary();
    }
  }, [user, id]);

  const loadSetlistAndLibrary = async () => {
    try {
      setLoading(true);

      const { data: setlist } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', id)
        .single();

      if (setlist) {
        setTitle(setlist.title || "SEM TÍTULO");
        setEvent(setlist.event_name || "");
        if (setlist.created_at) {
          setDate(new Date(setlist.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric'
          }));
        }
      }

      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email)
        .order('title', { ascending: true });

      if (songsData) setLibrarySongs(songsData);

      await loadAddedSongs();

    } catch (err) {
      console.error("Erro ao carregar dados:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAddedSongs = async () => {
    const { data: items } = await supabase
      .from('setlist_items')
      .select('id, song_id, order_index, songs(*)')
      .eq('setlist_id', id)
      .order('order_index', { ascending: true });

    if (items) {
      const formatted = items
        .filter(item => item.songs)
        .map(item => ({
          itemId: item.id, 
          orderIndex: item.order_index ?? 0,
          ...item.songs
        }));
      setAddedSongs(formatted);
    }
  };

  const handleAddSong = async (song) => {
    if (addedSongs.some(s => s.id === song.id)) return;
    const nextIndex = addedSongs.length;

    try {
      const { error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: id,
          song_id: song.id,
          order_index: nextIndex 
        });

      if (error) throw error;
      setSearchQuery(""); 
      await loadAddedSongs(); 
    } catch (err) {
      alert(`Erro ao adicionar música: ${err.message}`);
    }
  };

  const handleRemoveSong = async (song) => {
    try {
      const { error } = await supabase
        .from('setlist_items')
        .delete()
        .eq('setlist_id', id)
        .eq('song_id', song.id);

      if (error) throw error;
      await loadAddedSongs(); 
    } catch (err) {
      console.error("Erro ao remover música:", err.message);
    }
  };

  // ==========================================
  // LÓGICA DE ARRASTAR NATIVA (DRAG & DROP)
  // ==========================================
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDrop = async (index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedSongs = [...addedSongs];
    const draggedItem = updatedSongs[draggedIndex];
    
    // Move o item no array local
    updatedSongs.splice(draggedIndex, 1);
    updatedSongs.splice(index, 0, draggedItem);

    // Atualização otimista na tela
    setAddedSongs(updatedSongs);
    setDraggedIndex(null);

    try {
      // Salva a nova sequência de order_index em lote de forma limpa no Supabase
      const updates = updatedSongs.map((song, idx) => 
        supabase
          .from('setlist_items')
          .update({ order_index: idx })
          .eq('id', song.itemId)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error("Erro ao salvar ordenação no banco:", err.message);
      await loadAddedSongs(); // Fallback se der erro
    }
  };

  const searchResults = librarySongs.filter(song => {
    if (!searchQuery.trim()) return false;
    const matchText = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(matchText) ||
      (song.artist || "").toLowerCase().includes(matchText)
    );
  }).filter(song => !addedSongs.some(added => added.id === song.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase text-xs tracking-widest text-black">
        Carregando painel de edição...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans select-none text-black px-4">
      <div className="max-w-xl mx-auto pt-4">
        
        {/* BOTÕES DE AÇÃO SUPERIORES */}
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

        {/* INPUTS DE INFORMAÇÕES DO EVENTO */}
        <div className="mb-4">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-black text-3xl uppercase tracking-tighter outline-none border-b-4 border-black pb-1 placeholder-black/20 bg-transparent"
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

        {/* DATA DO SHOW */}
        <div className="flex items-center gap-2 mb-6 text-xs font-bold text-black/60 uppercase tracking-wider">
          <span>Data do Show:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-300 rounded-lg text-black font-medium normal-case">
            <Calendar size={12} className="text-black/40" />
            {date || "Sem data"}
          </div>
        </div>

        {/* DIVISOR MARCANTE */}
        <div className="border-b-4 border-black my-6" />

        {/* ABAS SELECIONAR / ORDENAR */}
        <div className="w-full border-2 border-black rounded-xl p-1 flex bg-white mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
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

        {/* CAMPO DE BUSCA (Apenas no modo Selecionar) */}
        {activeTab === "selecionar" && (
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digitar nome da música para adicionar..." 
              className="w-full pl-9 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:border-black outline-none transition-all"
            />
          </div>
        )}

        {/* RESULTADOS DA BUSCA (Modo Selecionar) */}
        {activeTab === "selecionar" && searchQuery.trim() && (
          <div className="border-2 border-black rounded-xl bg-white p-2 mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1 max-h-48 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-xs font-bold text-gray-500 p-2 italic">Nenhuma música disponível para adicionar...</p>
            ) : (
              searchResults.map(song => (
                <div key={song.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-black text-xs uppercase tracking-tight">{song.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{song.artist || 'Sem artista'}</p>
                  </div>
                  <button 
                    onClick={() => handleAddSong(song)}
                    className="px-3 py-1 bg-blue-600 text-white border border-black text-[10px] font-black uppercase rounded-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    + Adicionar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* SEÇÃO DA LISTA DE MÚSICAS */}
        <div className="mt-4 pt-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-black/40 mb-3 px-1">
            {activeTab === "ordenar" ? "Ajustar Ordem do Roteiro (Arraste os cards)" : "Músicas Escaladas"}
          </h3>
          
          {addedSongs.length === 0 ? (
            <div className="border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music size={22} />
              </div>
              <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu repertório está vazio</h3>
              <p className="text-xs font-bold text-black/60 mb-6 max-w-xs mx-auto">
                Pesquise e adicione músicas usando o campo acima.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {addedSongs.map((song, index) => (
                <div 
                  key={song.id} 
                  draggable={activeTab === "ordenar"} // Fica arrastável apenas na aba Ordenar
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`p-3.5 bg-white border-2 border-black rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                    activeTab === "ordenar" ? "cursor-grab active:cursor-grabbing hover:bg-gray-50 border-dashed" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {activeTab === "ordenar" && <GripVertical size={16} className="text-black/40 flex-shrink-0" />}
                    <span className="font-mono text-xs font-black text-gray-400">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="truncate">
                      <p className="font-black text-sm uppercase tracking-tight text-black truncate">{song.title}</p>
                      <p className="text-[10px] font-bold text-black/40 uppercase truncate">{song.artist || 'Sem artista'}</p>
                    </div>
                  </div>
                  
                  {/* CONTROLE LATERAL DA LINHA */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {activeTab === "selecionar" && (
                      <button 
                        onClick={() => handleRemoveSong(song)}
                        className="p-2 border border-red-200 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FOOTER NAVEGAÇÃO */}
      <nav className="fixed bottom-0 left-0 right-0 border-t-4 border-black bg-white px-4 py-3 flex gap-3 z-40">
        <button 
          onClick={() => navigate('/')}
          className="flex-1 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl"
        >
          Setlists
        </button>
        <button 
          onClick={() => navigate('/songs')}
          className="flex-1 py-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          <Music size={14} /> Letras
        </button>
      </nav>
    </div>
  );
}