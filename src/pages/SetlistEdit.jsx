import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Trash2, Search, 
  Music, Plus, Minus, Calendar, GripVertical, AlignLeft, RefreshCw 
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SetlistPdfDocument } from '../components/SetlistPdfDocument';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

// IMPORTAÇÕES DO DND-KIT
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ item, index, songCounter, onRemove, onUpdateDivider }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.itemId });
  const [confirmDelete, setConfirmDelete] = useState(false); // NOVO ESTADO

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1,
    scale: isDragging ? '1.02' : '1'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`border-2 border-black rounded-xl flex items-center justify-between transition-colors ${
        item.type === 'divider' ? "bg-black text-white p-2 sm:p-3 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]" : "bg-white p-2 sm:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      } ${isDragging ? 'shadow-2xl border-dashed' : ''}`}
    >
      
      {item.type === 'divider' ? (
        <div className="flex items-center gap-2 sm:gap-3 w-full mr-2">
          <div {...attributes} {...listeners} className="p-3 -ml-3 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-lg touch-none">
            <GripVertical size={20} className="text-white/40 flex-shrink-0" />
          </div>
          <input 
            type="text" value={item.content}
            onChange={(e) => onUpdateDivider(item.itemId, e.target.value)}
            className="bg-transparent font-black text-sm uppercase tracking-widest outline-none w-full placeholder-white/40 text-white"
            placeholder="DIGITE O NOME DO BLOCO"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-2">
          <div {...attributes} {...listeners} className="p-3 -ml-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-lg touch-none">
            <GripVertical size={20} className="text-black/30 flex-shrink-0" />
          </div>
          <span className="font-mono text-xs font-black text-gray-400 w-5 flex-shrink-0 text-center">
            {songCounter.toString().padStart(2, '0')}
          </span>
          <div className="truncate">
            <p className="font-black text-sm uppercase tracking-tight text-black truncate">{item.title}</p>
            <p className="text-[10px] font-bold text-black/40 uppercase truncate mt-0.5">{item.artist || 'Sem artista'}</p>
          </div>
        </div>
      )}

      {/* BOTÃO CORRIGIDO E ÚNICO */}
      <button 
        onClick={() => {
          if (confirmDelete) {
            onRemove(item.itemId);
          } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000); // Desfaz a lixeira após 3s
          }
        }}
        className={`flex-shrink-0 p-2 sm:p-3 border-2 rounded-xl transition-all ${
          confirmDelete 
            ? 'bg-red-500 border-red-500 text-white scale-105' 
            : item.type === 'divider' 
              ? 'border-white/20 text-white hover:bg-red-500 hover:border-red-500' 
              : 'border-transparent hover:border-black text-red-500 hover:bg-red-50'
        }`}
      >
        {confirmDelete ? <Trash2 size={18} strokeWidth={3} /> : <Minus size={18} strokeWidth={3} />}
      </button>

    </div>
  );
}

export default function SetlistEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [eventName, setEventName] = useState("");
  const [bandName, setBandName] = useState("");
  const [date, setDate] = useState(""); 
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [librarySongs, setLibrarySongs] = useState([]); 
  const [setlistItems, setSetlistItems] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (user && id) loadSetlistAndLibrary();
  }, [user, id]);

  const loadSetlistAndLibrary = async (silentRefresh = false) => {
    try {
      if (silentRefresh) setIsRefreshing(true);
      else {
        // 1. CARREGAMENTO OFFLINE DO CABEÇALHO
        const cachedSetlist = localStorage.getItem(`canta_setlist_info_${id}`);
        if (cachedSetlist) {
          const parsed = JSON.parse(cachedSetlist);
          setEventName(parsed.event_name || "");
          setBandName(parsed.band_name || "");
          setDate(parsed.date || "");
        }
        setLoading(true);
      }

      // 2. BUSCA NA NUVEM
      const { data: setlist } = await supabase.from('setlists').select('*').eq('id', id).single();
      if (setlist) {
        setEventName(setlist.event_name || "");
        setBandName(setlist.band_name || "");
        setDate(setlist.date || ""); 
        localStorage.setItem(`canta_setlist_info_${id}`, JSON.stringify(setlist));
      }

      const { data: songsData } = await supabase.from('songs').select('*').eq('created_by', user.email).order('title', { ascending: true });
      if (songsData) setLibrarySongs(songsData);

      await loadSetlistItems();
    } catch (err) {
      console.error("Modo Offline ativado na Edição:", err.message);
      // Se der erro, ele continua o fluxo chamando o loadSetlistItems que também puxa do cache
      await loadSetlistItems();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadSetlistItems = async () => {
    // CARREGAMENTO OFFLINE DOS ITENS
    const cachedItems = localStorage.getItem(`canta_setlist_items_${id}`);
    if (cachedItems && setlistItems.length === 0) {
      setSetlistItems(JSON.parse(cachedItems));
    }

    try {
      const { data: items } = await supabase.from('setlist_items').select('id, song_id, order_index, item_type, content, songs(*)').eq('setlist_id', id).order('order_index', { ascending: true });
      if (items) {
        const formatted = items.map(item => ({
          itemId: item.id,
          type: item.item_type === 'divider' ? 'divider' : 'song',
          content: item.content || "NOVO DIVISOR",
          orderIndex: item.order_index ?? 0,
          ...(item.songs || {})
        }));
        setSetlistItems(formatted);
        localStorage.setItem(`canta_setlist_items_${id}`, JSON.stringify(formatted));
      }
    } catch (e) {
      console.error("Offline: Usando músicas do cache.");
    }
  };

  const handleUpdateField = async (field, value) => {
    await supabase.from('setlists').update({ [field]: value }).eq('id', id);
  };

  const handleShare = async () => {
    try {
      const safeName = encodeURIComponent(eventName || 'ROTEIRO DO SHOW');
      const safeOwner = encodeURIComponent(user?.email ? user.email.split('@')[0].toUpperCase() : 'BANDA');

      // O LINK AGORA CARREGA OS DADOS PARA DRIBLAR O BLOQUEIO DE SEGURANÇA (RLS)
      const shareUrl = `${window.location.origin}/join/${id}?n=${safeName}&by=${safeOwner}`;

      const shareMessage = `🎤 *${decodeURIComponent(safeOwner)}* compartilhou o setlist *${decodeURIComponent(safeName)}* com você!\n\n👉 Clique no link para aceitar o convite e acessar o Teleprompter:\n${shareUrl}\n\n🎸 Já tem o APP *CANTA.PRO*? Crie sua conta grátis para salvar na sua biblioteca!`;
      
      await navigator.clipboard.writeText(shareMessage);
      alert("Mensagem de convite copiada! Pronto para colar no WhatsApp da banda.");
    } catch (err) { 
      alert("Não foi possível copiar a mensagem automaticamente."); 
    }
  };

  const handleDeleteSetlist = async () => {
    if (!window.confirm("Excluir permanentemente este setlist?")) return;
    setLoading(true);
    await supabase.from('setlist_items').delete().eq('setlist_id', id);
    await supabase.from('setlists').delete().eq('id', id);
    navigate('/');
  };

const handleAddSong = async (song) => {
    // Evita adicionar a mesma música duas vezes no mesmo repertório
    if (setlistItems.some(item => item.type === 'song' && item.id === song.id)) return;
    
    setIsRefreshing(true);
    await supabase.from('setlist_items').insert({ 
      setlist_id: id, 
      item_type: 'song', 
      song_id: song.id, 
      order_index: setlistItems.length 
    });
    
    // ATUALIZAÇÃO DE UX: Removemos o setSearchQuery("") daqui.
    // Assim o dropdown continua aberto e a palavra pesquisada se mantém, 
    // permitindo adicionar várias músicas do mesmo artista de uma vez!
    
    await loadSetlistItems();
    setIsRefreshing(false);
  };

  const handleAddDivider = async () => {
    setIsRefreshing(true);
    await supabase.from('setlist_items').insert({ setlist_id: id, item_type: 'divider', content: '— NOVO BLOCO —', order_index: setlistItems.length });
    await loadSetlistItems();
    setIsRefreshing(false);
  };

  const handleRemoveItem = async (itemId) => {
    setIsRefreshing(true);
    await supabase.from('setlist_items').delete().eq('id', itemId);
    await loadSetlistItems(); 
    setIsRefreshing(false);
  };

  const handleUpdateDividerText = async (itemId, newText) => {
    setSetlistItems(prev => prev.map(item => item.itemId === itemId ? { ...item, content: newText } : item));
    await supabase.from('setlist_items').update({ content: newText }).eq('id', itemId);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = setlistItems.findIndex((i) => i.itemId === active.id);
    const newIndex = setlistItems.findIndex((i) => i.itemId === over.id);
    const updatedItems = arrayMove(setlistItems, oldIndex, newIndex);
    
    setSetlistItems(updatedItems);
    
    try {
      const updates = updatedItems.map((item, idx) => supabase.from('setlist_items').update({ order_index: idx }).eq('id', item.itemId));
      await Promise.all(updates);
    } catch (err) {
      console.error("Erro ao salvar ordenação:", err.message);
      await loadSetlistItems(); 
    }
  };

  const searchResults = librarySongs.filter(song => {
    if (!searchQuery.trim()) return false;
    const matchText = searchQuery.toLowerCase();
    return song.title.toLowerCase().includes(matchText) || (song.artist || "").toLowerCase().includes(matchText);
  }).filter(song => !setlistItems.some(item => item.type === 'song' && item.id === song.id));

  let songCounter = 0;

  if (loading) return <LoadingScreen message="Carregando painel de edição..." />;

  return (
    <div className="min-h-screen bg-white pb-24 font-sans select-none text-black relative">
      
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 animate-[loadingBar_1s_infinite] z-50 overflow-hidden shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
      )}

      <div className="p-4 max-w-xl mx-auto">
        
        {/* BOTÕES SUPERIORES COM OVERFLOW E PADDING FIXO */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black active:scale-95">
            <ArrowLeft size={28} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pr-1">
            <button 
              onClick={() => loadSetlistAndLibrary(true)}
              className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black"
              title="Sincronizar Atualizações"
            >
              <RefreshCw size={18} strokeWidth={2.5} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            <PDFDownloadLink
              document={<SetlistPdfDocument eventName={eventName} bandName={bandName} date={date} orderedItems={setlistItems.map(item => item.type === 'divider' ? { id: item.itemId, item_type: 'divider', content: item.content } : { id: item.itemId, item_type: 'song', songs: { title: item.title || "Música sem título" } })} />}
              fileName={`${eventName || 'setlist'}.pdf`}
              className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-black"
            >
              {({ loading }) => (loading ? "..." : <Printer size={18} strokeWidth={2.5} />)}
            </PDFDownloadLink>

            <button onClick={handleShare} className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black">
              <Share2 size={18} strokeWidth={2.5} />
            </button>
            <button onClick={handleDeleteSetlist} className="p-2.5 bg-white border-2 border-black text-red-500 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <Trash2 size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} onBlur={() => handleUpdateField('event_name', eventName)} className="w-full font-black text-2xl sm:text-3xl uppercase tracking-tighter outline-none border-b-4 border-black pb-1 placeholder-black/20 bg-transparent" placeholder="NOME DO EVENTO" />
        </div>
        <div className="mb-4">
          <input type="text" value={bandName} onChange={(e) => setBandName(e.target.value)} onBlur={() => handleUpdateField('band_name', bandName)} className="w-full px-3 py-2.5 font-bold uppercase tracking-wide text-sm bg-transparent border-2 border-gray-300 rounded-xl focus:border-black outline-none transition-colors" placeholder="NOME DA BANDA" />
        </div>
        <div className="flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-wider">
          <span>Data:</span>
          <div className="relative inline-flex items-center bg-gray-50 border-2 border-black rounded-xl px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calendar size={14} className="text-black/50 mr-1.5 pointer-events-none" />
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); handleUpdateField('date', e.target.value); }} className="bg-transparent font-bold text-black outline-none border-none cursor-pointer uppercase text-xs" />
          </div>
        </div>

        <div className="border-b-4 border-black mb-6" />

        <div className="mb-6 relative">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar música..." className="w-full pl-9 pr-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-gray-50 focus:bg-white outline-none transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            </div>
            <button onClick={handleAddDivider} className="px-3 sm:px-4 bg-black text-white border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5">
              <AlignLeft size={14} /> <span className="hidden sm:inline">Divisor</span>
            </button>
          </div>

          {searchQuery.trim() && (
            <div className="absolute z-40 left-0 right-0 border-2 border-black rounded-xl bg-white p-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-1 max-h-64 overflow-y-auto mt-1">
              {searchResults.length === 0 ? (
                <p className="text-xs font-bold text-gray-500 p-2 italic">Nenhuma música encontrada...</p>
              ) : (
                searchResults.map(song => (
                  <div key={song.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-0">
                    <div className="truncate pr-2">
                      <p className="font-black text-xs uppercase tracking-tight truncate">{song.title}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{song.artist || 'Sem artista'}</p>
                    </div>
                    <button onClick={() => handleAddSong(song)} className="p-1.5 bg-blue-600 text-white rounded-lg active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex-shrink-0">
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {setlistItems.length === 0 ? (
          <div className="mt-8 border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4"><Music size={22} /></div>
            <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu roteiro está vazio</h3>
            <p className="text-xs font-bold text-black/60 leading-relaxed max-w-xs mx-auto">Utilize o campo de busca para adicionar músicas ou crie divisores.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest text-center">Arraste os blocos pelo ícone para ordenar</p>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={setlistItems.map(i => i.itemId)} strategy={verticalListSortingStrategy}>
                {setlistItems.map((item, index) => {
                  if (item.type === 'song') songCounter++;
                  return (
                    <SortableRow 
                      key={item.itemId} 
                      item={item} 
                      index={index} 
                      songCounter={songCounter} 
                      onRemove={handleRemoveItem} 
                      onUpdateDivider={handleUpdateDividerText} 
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        )}

      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t-4 border-black bg-white px-4 py-3 flex gap-3 z-40">
        <button onClick={() => navigate('/')} className="flex-1 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all">Setlists</button>
        <button onClick={() => navigate('/songs')} className="flex-1 py-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"><Music size={14} /> Letras</button>
      </nav>
      
      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
      `}</style>
    </div>
  );
}