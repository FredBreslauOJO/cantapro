import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Trash2, Search, 
  Music, Plus, Minus, Calendar, GripVertical, AlignLeft 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function SetlistEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  // Estados do Setlist (Mapeados para as colunas reais: event_name e band_name)
  const [eventName, setEventName] = useState("");
  const [bandName, setBandName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Estados de Gerenciamento do Roteiro (Músicas + Divisores)
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySongs, setLibrarySongs] = useState([]); 
  const [setlistItems, setSetlistItems] = useState([]); // Agora guarda tudo misturado!
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

      // 1. CARREGA O CABEÇALHO DO SETLIST
      const { data: setlist } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', id)
        .single();

      if (setlist) {
        setEventName(setlist.event_name || ""); // Nome principal
        setBandName(setlist.band_name || "");   // Subtítulo
        if (setlist.date) {
          // Ajuste para não bugar fuso horário
          const [year, month, day] = setlist.date.split('-');
          setDate(`${day}/${month}/${year}`);
        }
      }

      // 2. CARREGA A BIBLIOTECA DE MÚSICAS DO USUÁRIO
      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .eq('created_by', user.email)
        .order('title', { ascending: true });

      if (songsData) setLibrarySongs(songsData);

      // 3. CARREGA OS ITENS DO SETLIST (Músicas e Divisores)
      await loadSetlistItems();

    } catch (err) {
      console.error("Erro ao carregar dados:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSetlistItems = async () => {
    const { data: items } = await supabase
      .from('setlist_items')
      .select('id, song_id, order_index, item_type, content, songs(*)')
      .eq('setlist_id', id)
      .order('order_index', { ascending: true });

    if (items) {
      // Formata os dados para a UI saber se é música ou divisor
      const formatted = items.map(item => {
        if (item.item_type === 'divider') {
          return {
            itemId: item.id,
            type: 'divider',
            content: item.content || "NOVO DIVISOR",
            orderIndex: item.order_index ?? 0
          };
        } else {
          return {
            itemId: item.id,
            type: 'song',
            orderIndex: item.order_index ?? 0,
            ...(item.songs || {}) // Espalha os dados da música vinculada
          };
        }
      });
      setSetlistItems(formatted);
    }
  };

  // --- AÇÕES DO BANCO DE DADOS ---

  const handleAddSong = async (song) => {
    // Evita duplicatas da mesma música
    if (setlistItems.some(item => item.type === 'song' && item.id === song.id)) return;
    
    const nextIndex = setlistItems.length;

    try {
      const { error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: id,
          item_type: 'song',
          song_id: song.id,
          order_index: nextIndex 
        });

      if (error) throw error;
      setSearchQuery(""); 
      await loadSetlistItems(); 
    } catch (err) {
      alert(`Erro ao adicionar música: ${err.message}`);
    }
  };

  const handleAddDivider = async () => {
    const nextIndex = setlistItems.length;

    try {
      const { error } = await supabase
        .from('setlist_items')
        .insert({
          setlist_id: id,
          item_type: 'divider',
          content: '— NOVO BLOCO —', // Texto padrão
          order_index: nextIndex
        });

      if (error) throw error;
      await loadSetlistItems();
    } catch (err) {
      alert(`Erro ao criar divisor: ${err.message}`);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('setlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadSetlistItems(); 
    } catch (err) {
      console.error("Erro ao remover item:", err.message);
    }
  };

  // Atualiza o texto do divisor ao digitar
  const handleUpdateDividerText = async (itemId, newText) => {
    // Atualização otimista local
    setSetlistItems(prev => prev.map(item => 
      item.itemId === itemId ? { ...item, content: newText } : item
    ));

    // Atualiza no banco silenciosamente
    try {
      await supabase
        .from('setlist_items')
        .update({ content: newText })
        .eq('id', itemId);
    } catch (err) {
      console.error("Erro ao salvar texto do divisor:", err.message);
    }
  };

  // --- LÓGICA DE ARRASTAR (NATIVA) ---
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedItems = [...setlistItems];
    const draggedItem = updatedItems[draggedIndex];
    
    updatedItems.splice(draggedIndex, 1);
    updatedItems.splice(index, 0, draggedItem);

    setSetlistItems(updatedItems); 
    setDraggedIndex(null);

    try {
      // Reordena o índice de todo mundo no banco
      const updates = updatedItems.map((item, idx) => 
        supabase.from('setlist_items').update({ order_index: idx }).eq('id', item.itemId)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error("Erro ao salvar ordenação:", err.message);
      await loadSetlistItems(); 
    }
  };

  // Filtro de Busca (oculta músicas que já estão na lista)
  const searchResults = librarySongs.filter(song => {
    if (!searchQuery.trim()) return false;
    const matchText = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(matchText) ||
      (song.artist || "").toLowerCase().includes(matchText)
    );
  }).filter(song => !setlistItems.some(item => item.type === 'song' && item.id === song.id));

  // Função para contar apenas as músicas (para exibir o número correto "01", "02") ignorando os divisores
  let songCounter = 0;

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

        {/* TÍTULO E NOME DO SHOW (Lendo event_name e band_name) */}
        <div className="mb-4">
          <input 
            type="text" 
            value={eventName} 
            onChange={(e) => setEventName(e.target.value)}
            className="w-full font-black text-3xl uppercase tracking-tighter outline-none border-b-4 border-black pb-1 placeholder-black/20 bg-transparent"
            placeholder="NOME DO EVENTO"
          />
        </div>

        <div className="mb-4">
          <input 
            type="text" 
            value={bandName} 
            onChange={(e) => setBandName(e.target.value)}
            className="w-full px-3 py-2.5 font-bold uppercase tracking-wide text-sm bg-transparent border-2 border-gray-300 rounded-xl focus:border-black outline-none transition-colors"
            placeholder="NOME DA BANDA"
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

        {/* MODO SELECIONAR: Busca e Botão de Divisor */}
        {activeTab === "selecionar" && (
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar música..." 
                  className="w-full pl-9 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 focus:bg-white outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleAddDivider}
                className="px-4 bg-black text-white border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5"
                title="Adicionar um divisor de blocos no setlist"
              >
                <AlignLeft size={14} /> Divisor
              </button>
            </div>

            {/* RESULTADOS SUSPENSOS DA BUSCA */}
            {searchQuery.trim() && (
              <div className="border-2 border-black rounded-xl bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-1 max-h-48 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="text-xs font-bold text-gray-500 p-2 italic">Nenhuma música não adicionada encontrada...</p>
                ) : (
                  searchResults.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-black text-xs uppercase tracking-tight">{song.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{song.artist || 'Sem artista'}</p>
                      </div>
                      <button 
                        onClick={() => handleAddSong(song)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg active:scale-95 transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-black"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TELA DE AVISO (EMPTY STATE) SE O SETLIST ESTIVER VAZIO */}
        {setlistItems.length === 0 ? (
          <div className="mt-8 border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Music size={22} />
            </div>
            <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu roteiro está vazio</h3>
            <p className="text-xs font-bold text-black/60 leading-relaxed max-w-xs mx-auto">
              Utilize o campo de busca para adicionar músicas ou crie divisores para separar os momentos do show.
            </p>
          </div>
        ) : (
          /* LISTAGEM DO ROTEIRO (Músicas + Divisores) */
          <div className="mt-4 space-y-3">
            {activeTab === "ordenar" && (
              <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest text-center">
                Arraste os blocos para ajustar a ordem do show
              </p>
            )}
            
            {setlistItems.map((item, index) => {
              // Se for música, incrementa o contador para exibir "01", "02" na UI
              if (item.type === 'song') songCounter++;

              return (
                <div 
                  key={item.itemId} 
                  draggable={activeTab === "ordenar"}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`border-2 border-black rounded-xl flex items-center justify-between transition-all ${
                    item.type === 'divider' ? "bg-black text-white p-3 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]" : "bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  } ${activeTab === "ordenar" ? "cursor-grab active:cursor-grabbing border-dashed" : ""}`}
                >
                  
                  {/* CONTEÚDO DO CARD (Varia se é Divisor ou Música) */}
                  {item.type === 'divider' ? (
                    <div className="flex items-center gap-3 w-full">
                      {activeTab === "ordenar" && <GripVertical size={16} className="text-white/40 flex-shrink-0" />}
                      <input 
                        type="text"
                        value={item.content}
                        onChange={(e) => handleUpdateDividerText(item.itemId, e.target.value)}
                        className="bg-transparent font-black text-sm uppercase tracking-widest outline-none w-full placeholder-white/40"
                        placeholder="DIGITE O NOME DO BLOCO"
                        readOnly={activeTab === "ordenar"}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 min-w-0">
                      {activeTab === "ordenar" && <GripVertical size={18} className="text-black/30 flex-shrink-0" />}
                      <span className="font-mono text-xs font-black text-gray-400">
                        {songCounter.toString().padStart(2, '0')}
                      </span>
                      <div className="truncate">
                        <p className="font-black text-sm uppercase tracking-tight text-black truncate">{item.title}</p>
                        <p className="text-[10px] font-bold text-black/40 uppercase truncate mt-0.5">{item.artist || 'Sem artista'}</p>
                      </div>
                    </div>
                  )}

                  {/* Botão de Remover apenas na aba Selecionar */}
                  {activeTab === "selecionar" && (
                    <button 
                      onClick={() => handleRemoveItem(item.itemId)}
                      className={`flex-shrink-0 ml-2 p-2 border-2 rounded-xl transition-all ${
                        item.type === 'divider' 
                        ? 'border-white/20 text-white hover:bg-red-500 hover:border-red-500' 
                        : 'border-transparent hover:border-black text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Minus size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* FOOTER NAVEGAÇÃO FIXO */}
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