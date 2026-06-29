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

  // Estados de Músicas
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySongs, setLibrarySongs] = useState([]); 
  const [addedSongs, setAddedSongs] = useState([]);     
  const [activeTab, setActiveTab] = useState("selecionar");
  
  // Estado para o Drag & Drop (Arrastar)
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
      setSearchQuery(""); // Limpa a busca ao adicionar
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

  // --- LÓGICA DE ARRASTAR (NATIVA) ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    // Pequeno efeito visual ao arrastar
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Permite o drop
  };

  const handleDrop = async (index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedSongs = [...addedSongs];
    const draggedItem = updatedSongs[draggedIndex];
    
    updatedSongs.splice(draggedIndex, 1);
    updatedSongs.splice(index, 0, draggedItem);

    setAddedSongs(updatedSongs); // Atualiza UI instantaneamente
    setDraggedIndex(null);

    try {
      const updates = updatedSongs.map((song, idx) => 
        supabase.from('setlist_items').update({ order_index: idx }).eq('id', song.itemId)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error("Erro ao salvar ordenação:", err.message);
      await loadAddedSongs(); // Reverte em caso de erro
    }
  };

  // Filtra as músicas da biblioteca que não estão no setlist ainda
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
    <div className="min-h-screen bg-white pb-24 font-sans select-none text-black">
      <div className="p-4 max-w-xl mx-auto">
        
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

        {/* TÍTULO E NOME DO SHOW (Resgatado do seu Backup Exato) */}
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

        {/* DATA DO SHOW (Resgatado do seu Backup) */}
        <div className="flex items-center gap-2 mb-6 text-xs font-bold text-black/60 uppercase tracking-wider">
          <span>Data do Show:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 border border-gray-300 rounded-lg text-black font-medium normal-case">
            <Calendar size={12} className="text-black/40" />
            {date || "Sem data"}
          </div>
        </div>

        {/* ABAS: SELECIONAR / ORDENAR */}
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

        {/* MODO SELECIONAR: Busca e Listagem Local */}
        {activeTab === "selecionar" && (
          <>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar música ou artista para adicionar..." 
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-300 focus:border-black outline-none rounded-xl text-sm font-medium transition-colors"
              />
            </div>

            {/* RESULTADOS SUSPENSOS DA BUSCA */}
            {searchQuery.trim() && (
              <div className="border-2 border-black rounded-xl bg-white p-2 mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1 max-h-48 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-xs font-bold text-gray-500 p-2 italic">Nenhuma música na sua biblioteca com esse nome...</p>
                ) : (
                  searchResults.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-black text-xs uppercase tracking-tight">{song.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{song.artist || 'Sem artista'}</p>
                      </div>
                      <button 
                        onClick={() => handleAddSong(song)}
                        className="p-1.5 bg-black text-white rounded-lg active:scale-95 transition-all"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* TELA DE AVISO (EMPTY STATE) SE O SETLIST ESTIVER VAZIO */}
        {addedSongs.length === 0 ? (
          <div className="mt-8 border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Music size={22} />
            </div>
            <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu repertório está vazio</h3>
            <p className="text-xs font-bold text-black/60 leading-relaxed max-w-xs mx-auto">
              Utilize o campo de busca acima para adicionar as músicas que você já salvou na sua biblioteca.
            </p>
          </div>
        ) : (
          /* LISTAGEM DAS MÚSICAS ESCALADAS (Card Sólido Original) */
          <div className="mt-4 space-y-3">
            {activeTab === "ordenar" && (
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest text-center">
                Arraste os cards para ajustar a ordem
              </p>
            )}
            
            {addedSongs.map((song, index) => (
              <div 
                key={song.id} 
                draggable={activeTab === "ordenar"}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`p-4 border-2 border-black rounded-xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white ${
                  activeTab === "ordenar" ? "cursor-grab active:cursor-grabbing hover:bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Ícone de Arrastar apenas na aba Ordenar */}
                  {activeTab === "ordenar" && <GripVertical size={18} className="text-black/30 flex-shrink-0" />}
                  
                  <span className="font-mono text-xs font-black text-gray-400">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="truncate">
                    <p className="font-black text-sm uppercase tracking-tight text-black truncate">{song.title}</p>
                    <p className="text-[10px] font-bold text-black/40 uppercase truncate mt-0.5">{song.artist || 'Sem artista'}</p>
                  </div>
                </div>

                {/* Botão de Remover apenas na aba Selecionar. */}
                {activeTab === "selecionar" && (
                  <button 
                    onClick={() => handleRemoveSong(song)}
                    className="p-2 border-2 border-transparent hover:border-black text-red-500 rounded-xl transition-all hover:bg-red-50"
                  >
                    <Minus size={18} strokeWidth={3} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}