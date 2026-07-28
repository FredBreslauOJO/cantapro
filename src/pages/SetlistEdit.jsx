import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Share2, Trash2, Search, 
  Music, Plus, Minus, Calendar, GripVertical, AlignLeft, RefreshCw, LogOut 
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SetlistPdfDocument } from '../components/SetlistPdfDocument';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import PaywallModal from '../components/PaywallModal';

// IMPORTAÇÕES DO DND-KIT
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableRow({ item, index, songCounter, onRemove, onUpdateDivider, isReadOnly }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.itemId });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1,
    scale: isDragging ? '1.02' : '1'
  };

  return (
    <div 
      ref={isReadOnly ? null : setNodeRef} 
      style={style}
      className={`border-2 border-black rounded-xl flex items-center justify-between transition-colors ${
        item.type === 'divider' ? "bg-black text-white p-2 sm:p-3 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]" : "bg-white p-2 sm:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      } ${isDragging ? 'shadow-2xl border-dashed' : ''}`}
    >
      
      {item.type === 'divider' ? (
        <div className="flex items-center gap-2 sm:gap-3 w-full mr-2">
          {!isReadOnly && (
            <div {...attributes} {...listeners} className="p-3 -ml-3 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-lg touch-none">
              <GripVertical size={20} className="text-white/40 flex-shrink-0" />
            </div>
          )}
          <input 
            type="text" value={item.content}
            onChange={(e) => onUpdateDivider(item.itemId, e.target.value)}
            disabled={isReadOnly}
            className="bg-transparent font-black text-sm uppercase tracking-widest outline-none w-full placeholder-white/40 text-white disabled:opacity-80"
            placeholder="DIGITE O NOME DO BLOCO"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 mr-2">
          {!isReadOnly && (
            <div {...attributes} {...listeners} className="p-3 -ml-3 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded-lg touch-none">
              <GripVertical size={20} className="text-black/30 flex-shrink-0" />
            </div>
          )}
          <span className="font-mono text-xs font-black text-gray-400 w-5 flex-shrink-0 text-center">
            {songCounter.toString().padStart(2, '0')}
          </span>
          <div className="truncate pl-1">
            <p className="font-black text-sm uppercase tracking-tight text-black truncate">{item.title}</p>
            <p className="text-[10px] font-bold text-black/40 uppercase truncate mt-0.5">{item.artist || 'Sem artista'}</p>
          </div>
        </div>
      )}

      {!isReadOnly && (
        <button 
          onClick={() => {
            if (confirmDelete) onRemove(item.itemId);
            else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
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
      )}

    </div>
  );
}

export default function SetlistEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, plan } = useAuth();

  const [eventName, setEventName] = useState("");
  const [bandName, setBandName] = useState("");
  const [date, setDate] = useState(""); 
  const [isGuest, setIsGuest] = useState(false); // Sabe se é dono ou convidado
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [librarySongs, setLibrarySongs] = useState([]); 
  const [setlistItems, setSetlistItems] = useState([]);

  // Modo leitura: Se for plano FREE e for apenas CONVIDADO (não é dono).
  const isReadOnly = isGuest && (plan || 'free') === 'free';

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
      else setLoading(true);

      const { data: setlist } = await supabase.from('setlists').select('*').eq('id', id).single();
      if (setlist) {
        setEventName(setlist.event_name || "");
        setBandName(setlist.band_name || "");
        setDate(setlist.date || ""); 
        setIsGuest(setlist.created_by !== user.email);
      }

      const { data: songsData } = await supabase.from('songs').select('*').eq('created_by', user.email).order('title', { ascending: true });
      if (songsData) setLibrarySongs(songsData);

      await loadSetlistItems();
    } catch (err) {
      console.error("Erro ao carregar edição:", err.message);
      await loadSetlistItems();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadSetlistItems = async () => {
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateField = async (field, value) => {
    if (isReadOnly) return;
    await supabase.from('setlists').update({ [field]: value }).eq('id', id);
  };

  const handleShare = async () => {
    if ((plan || 'free') === 'free') {
      setIsPaywallOpen(true);
      return;
    }
    try {
      const safeName = encodeURIComponent(eventName || 'ROTEIRO DO SHOW');
      const safeOwner = encodeURIComponent(user?.email ? user.email.split('@')[0].toUpperCase() : 'BANDA');
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

  const handleLeaveSetlist = async () => {
    if (!window.confirm("Sair deste repertório compartilhado?")) return;
    setLoading(true);
    await supabase.from('setlist_members').delete().match({ setlist_id: id, member_email: user.email });
    navigate('/');
  };

  const handleAddSong = async (song) => {
    if (isReadOnly || setlistItems.some(item => item.type === 'song' && item.id === song.id)) return;
    setIsRefreshing(true);
    await supabase.from('setlist_items').insert({ setlist_id: id, item_type: 'song', song_id: song.id, order_index: setlistItems.length });
    await loadSetlistItems();
    setIsRefreshing(false);
  };

  const handleAddDivider = async () => {
    if (plan !== 'pro') {
      setIsPaywallOpen(true);
      return;
    }
    setIsRefreshing(true);
    await supabase.from('setlist_items').insert({ setlist_id: id, item_type: 'divider', content: '— NOVO BLOCO —', order_index: setlistItems.length });
    await loadSetlistItems();
    setIsRefreshing(false);
  };

  const handleRemoveItem = async (itemId) => {
    if (isReadOnly) return;
    setIsRefreshing(true);
    await supabase.from('setlist_items').delete().eq('id', itemId);
    await loadSetlistItems(); 
    setIsRefreshing(false);
  };

  const handleUpdateDividerText = async (itemId, newText) => {
    if (isReadOnly) return;
    setSetlistItems(prev => prev.map(item => item.itemId === itemId ? { ...item, content: newText } : item));
    await supabase.from('setlist_items').update({ content: newText }).eq('id', itemId);
  };

  const handleDragEnd = async (event) => {
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = setlistItems.findIndex((i) => i.itemId === active.id);
    const newIndex = setlistItems.findIndex((i) => i.itemId === over.id);
    const updatedItems = arrayMove(setlistItems, oldIndex, newIndex);
    setSetlistItems(updatedItems);
    try {
      const updates = updatedItems.map((item, idx) => supabase.from('setlist_items').update({ order_index: idx }).eq('id', item.itemId));
      await Promise.all(updates);
    } catch (err) { await loadSetlistItems(); }
  };

  const searchResults = librarySongs.filter(song => {
    if (!searchQuery.trim()) return false;
    const matchText = searchQuery.toLowerCase();
    return song.title.toLowerCase().includes(matchText) || (song.artist || "").toLowerCase().includes(matchText);
  }).filter(song => !setlistItems.some(item => item.type === 'song' && item.id === song.id));

  let songCounter = 0;

  if (loading) return <LoadingScreen message="Carregando painel..." />;

  return (
    <div className="min-h-screen bg-white pb-24 font-sans select-none text-black relative">
      
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 animate-[loadingBar_1s_infinite] z-50 overflow-hidden shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
      )}

      <div className="p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black active:scale-95">
            <ArrowLeft size={28} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pr-1">
            <button 
              onClick={() => loadSetlistAndLibrary(true)}
              className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black"
            >
              <RefreshCw size={18} strokeWidth={2.5} className={isRefreshing ? "animate-spin" : ""} />
            </button>

            {/* FAKE BUTTON PARA ABRIR PAYWALL NO PDF PARA FREE/BASE */}
            {plan === 'pro' ? (
              <PDFDownloadLink
                document={<SetlistPdfDocument eventName={eventName} bandName={bandName} date={date} orderedItems={setlistItems.map(item => item.type === 'divider' ? { id: item.itemId, item_type: 'divider', content: item.content } : { id: item.itemId, item_type: 'song', songs: { title: item.title || "Música sem título" } })} />}
                fileName={`${eventName || 'setlist'}.pdf`}
                className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-black"
              >
                {({ loading }) => (loading ? "..." : <Printer size={18} strokeWidth={2.5} />)}
              </PDFDownloadLink>
            ) : (
              <button onClick={() => setIsPaywallOpen(true)} className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center text-black">
                <Printer size={18} strokeWidth={2.5} />
              </button>
            )}

            <button onClick={handleShare} className="p-2.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-black">
              <Share2 size={18} strokeWidth={2.5} />
            </button>
            
            {/* LOGICA DE EXCLUIR (DONO) vs SAIR (CONVIDADO) */}
            {isGuest ? (
               <button onClick={handleLeaveSetlist} className="p-2.5 bg-white border-2 border-orange-500 text-orange-500 rounded-xl shadow-[3px_3px_0px_0px_rgba(249,115,22,1)] hover:bg-orange-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" title="Sair do Repertório">
                 <LogOut size={18} strokeWidth={2.5} />
               </button>
            ) : (
               <button onClick={handleDeleteSetlist} className="p-2.5 bg-white border-2 border-black text-red-500 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all" title="Excluir Repertório">
                 <Trash2 size={18} strokeWidth={2.5} />
               </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} onBlur={() => handleUpdateField('event_name', eventName)} disabled={isReadOnly} className="w-full font-black text-2xl sm:text-3xl uppercase tracking-tighter outline-none border-b-4 border-black pb-1 placeholder-black/20 bg-transparent disabled:opacity-70" placeholder="NOME DO EVENTO" />
        </div>
        <div className="mb-4">
          <input type="text" value={bandName} onChange={(e) => setBandName(e.target.value)} onBlur={() => handleUpdateField('band_name', bandName)} disabled={isReadOnly} className="w-full px-3 py-2.5 font-bold uppercase tracking-wide text-sm bg-transparent border-2 border-gray-300 rounded-xl focus:border-black outline-none transition-colors disabled:opacity-70 disabled:bg-gray-100" placeholder="NOME DA BANDA" />
        </div>
        <div className="flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-wider">
          <span>Data:</span>
          <div className="relative inline-flex items-center bg-gray-50 border-2 border-black rounded-xl px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Calendar size={14} className="text-black/50 mr-1.5 pointer-events-none" />
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); handleUpdateField('date', e.target.value); }} disabled={isReadOnly} className="bg-transparent font-bold text-black outline-none border-none cursor-pointer uppercase text-xs disabled:opacity-70" />
          </div>
        </div>

        <div className="border-b-4 border-black mb-6" />

        {/* ESCONDE A BUSCA SE FOR CONVIDADO FREE */}
        {!isReadOnly && (
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
        )}

        {isReadOnly && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Apenas Leitura (Convidado)</p>
            <p className="text-[10px] text-blue-600 mt-1 font-medium">Faça upgrade para Base/Pro para colaborar neste repertório.</p>
          </div>
        )}

        {setlistItems.length === 0 ? (
          <div className="mt-8 border-4 border-dashed border-black rounded-3xl p-8 text-center bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4"><Music size={22} /></div>
            <h3 className="font-black uppercase tracking-tight text-base mb-2">Seu roteiro está vazio</h3>
            <p className="text-xs font-bold text-black/60 leading-relaxed max-w-xs mx-auto">Adicione músicas ao repertório.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {!isReadOnly && <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest text-center">Arraste os blocos pelo ícone para ordenar</p>}
            
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
                      isReadOnly={isReadOnly}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        )}

      </div>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />

      <nav className="fixed bottom-0 left-0 right-0 border-t-4 border-black bg-white px-4 py-3 flex gap-3 z-40">
        <button onClick={() => navigate('/')} className="flex-1 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all">Setlists</button>
        <button onClick={() => navigate('/songs')} className="flex-1 py-3 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"><Music size={14} /> Letras</button>
      </nav>
    </div>
  );
}