import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Search, ArrowLeft, Globe, CheckSquare, Square, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import PaywallModal from "../components/PaywallModal";
import OnlineLyricsSearch from "../components/OnlineLyricsSearch";
import LoadingScreen from "../components/LoadingScreen"; 

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showOnlineSearch, setShowOnlineSearch] = useState(false);
  
  // ESTADOS PARA O MODO DE EDIÇÃO EM LOTE
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { user, plan } = useAuth();

  useEffect(() => {
    if (user) {
      loadSongs();
    } else {
      setLoading(false); 
    }
  }, [user]);

  const loadSongs = async () => {
    const cached = localStorage.getItem('canta_songs_offline');
    if (cached && songs.length === 0) {
      const parsed = JSON.parse(cached);
      setSongs(parsed);
      setLoading(false); 
    } else if (songs.length === 0) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email)
        .order('created_date', { ascending: false });
      
      if (!error && data) {
        setSongs(data);
        localStorage.setItem('canta_songs_offline', JSON.stringify(data));
      }
    } catch (err) {
      console.error("Modo offline ativado na listagem de letras.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (plan === 'free' && songs.length >= 10) {
      setIsPaywallOpen(true);
      return;
    }
    navigate("/songs/new");
  };

  const handleSaveLyricsFromWeb = async (songData) => {
    try {
      const { error } = await supabase
        .from('songs')
        .insert({
          created_by: user.email, 
          title: songData.title,
          artist: songData.artist,
          duration_seconds: Math.round(songData.duration) || 0,
          lyrics_text: songData.raw_text || "",     
          timecode_blocks: songData.blocks 
        });

      if (error) throw error;

      setShowOnlineSearch(false);
      loadSongs();
    } catch (err) {
      alert(`Erro ao importar letra: ${err.message}`);
    }
  };

  // FUNÇÕES DE SELEÇÃO E EXCLUSÃO MÚLTIPLA
  const toggleSongSelection = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSongs.length === filtered.length) {
      setSelectedSongs([]); // Desmarca tudo se já estava tudo marcado
    } else {
      setSelectedSongs(filtered.map(s => s.id)); // Marca tudo que está visível na tela
    }
  };

  const cancelEditMode = () => {
    setIsEditingMode(false);
    setSelectedSongs([]);
  };

  const executeBulkDelete = async () => {
    if (selectedSongs.length === 0) return;
    setIsDeleting(true);

    try {
      // O Supabase possui a função .in() que permite deletar vários IDs de uma vez!
      const { error } = await supabase
        .from('songs')
        .delete()
        .in('id', selectedSongs);

      if (error) throw error;

      // Limpa as seleções e atualiza a lista
      setShowDeleteModal(false);
      cancelEditMode();
      loadSongs();
    } catch (err) {
      alert("Ocorreu um erro ao excluir as músicas: " + err.message);
      setIsDeleting(false);
    }
  };

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || "").toLowerCase().includes(search.toLowerCase())
  );

  const groupedSongs = filtered.reduce((acc, song) => {
    const sortKey = (song[sortBy] || "Desconhecido").trim().toUpperCase();
    const firstLetter = sortKey.charAt(0).match(/[A-Z]/) ? sortKey.charAt(0) : "#";
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedSongs).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="py-6 max-w-2xl mx-auto px-4 font-sans select-none text-black relative min-h-screen">
      
      {/* CABEÇALHO DINÂMICO */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => {
              if (showOnlineSearch) {
                setShowOnlineSearch(false);
              } else if (isEditingMode) {
                cancelEditMode();
              } else {
                navigate("/");
              }
            }} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-black active:scale-95"
            title="Voltar"
          >
            <ArrowLeft size={28} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-2">
            {!showOnlineSearch && !isEditingMode && (
              <button
                onClick={() => setShowOnlineSearch(true)}
                className="px-4 h-12 bg-black text-white border-2 border-black font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-gray-800"
              >
                <Globe size={16} /> Buscar Web
              </button>
            )}

            {showOnlineSearch ? (
              <button
                onClick={() => setShowOnlineSearch(false)}
                className="px-4 h-12 bg-white text-black border-2 border-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all hover:bg-gray-50"
              >
                Cancelar
              </button>
            ) : isEditingMode ? (
               <button
                onClick={toggleSelectAll}
                className="px-4 h-12 bg-gray-100 text-black border-2 border-transparent font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-gray-200"
              >
                {selectedSongs.length === filtered.length ? "Desmarcar Todos" : "Marcar Todos"}
              </button>
            ) : (
              <button 
                onClick={handleCreateNew} 
                className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
              >
                <Plus size={18} className="pointer-events-none" />
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs tracking-[0.15em] uppercase text-gray-400 mb-0.5">
            {showOnlineSearch ? "Importação Global" : isEditingMode ? "Edição em Lote" : "Biblioteca"}
          </p>
          <h1 className="text-3xl font-black tracking-tight uppercase text-foreground whitespace-nowrap">
            {showOnlineSearch ? "Buscar na Web" : isEditingMode ? `${selectedSongs.length} Selecionadas` : "Editar Letras"}
          </h1>
        </div>
      </div>

      {showOnlineSearch ? (
        <div className="animate-fadeIn">
          <OnlineLyricsSearch 
            userPlan={plan} 
            onSaveLyrics={handleSaveLyricsFromWeb} 
            onUpgradeClick={() => setIsPaywallOpen(true)}
          />
        </div>
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={isEditingMode}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-black/10 transition font-bold disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full max-w-[240px]">
              <button
                onClick={() => setSortBy("title")}
                disabled={isEditingMode}
                className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase ${sortBy === "title" ? "bg-white shadow-sm text-foreground" : "text-gray-400"} disabled:opacity-50`}
              >
                Por Título
              </button>
              <button
                onClick={() => setSortBy("artist")}
                disabled={isEditingMode}
                className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase ${sortBy === "artist" ? "bg-white shadow-sm text-foreground" : "text-gray-400"} disabled:opacity-50`}
              >
                Por Artista
              </button>
            </div>
            
            {/* O NOVO BOTÃO DE SELECIONAR */}
            {!isEditingMode && songs.length > 0 && (
              <button 
                onClick={() => setIsEditingMode(true)}
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckSquare size={14} /> Selecionar
              </button>
            )}
          </div>

          {loading ? (
            <LoadingScreen message="Carregando biblioteca..." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Nenhuma música encontrada.</p>
              <button onClick={handleCreateNew} className="px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity active:scale-95">
                Adicionar primeira música
              </button>
            </div>
          ) : (
            <div className="pb-28">
              {sortedLetters.map(letter => (
                <div key={letter} className="mb-4">
                  <div className="sticky top-0 z-10 bg-white py-1 mb-2 border-b-2 border-black">
                    <span className="text-sm font-black text-black">{letter}</span>
                  </div>
                  <div className="space-y-1">
                    {groupedSongs[letter]
                      .sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""))
                      .map(song => {
                        const isSelected = selectedSongs.includes(song.id);
                        return (
                          <button
                            key={song.id}
                            onClick={() => isEditingMode ? toggleSongSelection(song.id) : navigate(`/songs/${song.id}`)}
                            className={`w-full flex items-center px-3 min-h-[52px] border-b-2 transition-colors rounded-lg text-left active:scale-[0.99] group
                              ${isEditingMode 
                                ? (isSelected ? 'bg-yellow-50 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-transparent border-black/5 hover:bg-gray-50') 
                                : 'border-black/10 hover:bg-black hover:text-white'
                              }
                            `}
                          >
                            {/* Checkbox Visual no Modo Edição */}
                            {isEditingMode && (
                              <div className="mr-3 flex-shrink-0 text-black">
                                {isSelected ? <CheckSquare size={20} className="text-yellow-600" /> : <Square size={20} className="text-gray-300" />}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className={`font-black text-sm uppercase tracking-tight truncate ${!isEditingMode && 'group-hover:text-white'} ${isEditingMode && isSelected ? 'text-black' : 'text-black'}`}>
                                {song.title}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${!isEditingMode && 'text-black/50 group-hover:text-white/60'} ${isEditingMode && isSelected ? 'text-yellow-700' : 'text-black/40'}`}>
                                {song.artist}
                              </p>
                            </div>

                            {/* Ícone de Lápis Padrão */}
                            {!isEditingMode && (
                              <Pencil size={12} className="text-black/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-3" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BARRA FLUTUANTE DE AÇÃO (Aparece apenas quando há músicas selecionadas) */}
      {isEditingMode && selectedSongs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black border-2 border-black p-2 rounded-2xl flex items-center shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] z-40 w-[90%] max-w-sm animate-fadeIn">
          <div className="px-4 py-2 flex-1 text-white text-xs font-black uppercase tracking-widest text-center">
            {selectedSongs.length} selecionadas
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
          >
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      )}

      {/* MODAL DE ALERTA DE EXCLUSÃO CRÍTICA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]" onClick={e => e.stopPropagation()}>
            <div className="bg-red-50 p-6 flex flex-col items-center border-b-2 border-black text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 border-2 border-black rounded-2xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-black mb-2">Excluir {selectedSongs.length} músicas?</h3>
              <p className="text-xs font-bold text-red-600/80 uppercase tracking-widest px-4">Esta ação é irreversível.</p>
            </div>
            
            <div className="p-6 bg-white space-y-4">
              <p className="text-sm font-medium text-black/80 text-center">
                Ao confirmar, estas músicas serão apagadas da sua biblioteca e <strong>removidas de todos os repertórios</strong> que você ou sua banda criaram.
              </p>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-gray-100 text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeBulkDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white border-2 border-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
    </div>
  );
}