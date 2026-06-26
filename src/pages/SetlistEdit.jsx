import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ArrowLeft, Plus, Minus, GripVertical, Trash2, Search, ToggleLeft, ToggleRight, Share2, Printer, SplitSquareVertical, Pencil, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SetlistPdfDocument } from '../components/SetlistPdfDocument';
import PaywallModal from "../components/PaywallModal";

export default function SetlistEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, plan } = useAuth();

  const [eventName, setEventName] = useState("");
  const [bandName, setBandName] = useState("");
  const [date, setDate] = useState("");
  
  const [songs, setSongs] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [addedSongIds, setAddedSongIds] = useState(new Set());
  
  const [search, setSearch] = useState("");
  const [showOnlyAdded, setShowOnlyAdded] = useState(false);
  const [tab, setTab] = useState("select");
  
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  useEffect(() => {
    if (user && id) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);
    const { data: sl } = await supabase.from('setlists').select('*').eq('id', id).single();
    if (sl) {
      setEventName(sl.event_name || "");
      setBandName(sl.band_name || "");
      setDate(sl.date || "");
    }

    const { data: dbItems } = await supabase.from('setlist_items').select('*').eq('setlist_id', id).order('order_index', { ascending: true });
    if (dbItems) {
      setOrderedItems(dbItems);
      setAddedSongIds(new Set(dbItems.filter(i => i.item_type !== "divider").map(i => i.song_id)));
    }

    const { data: ownSongs } = await supabase.from('songs').select('*').eq('created_by', user.email);
    if (ownSongs) {
      setSongs(ownSongs.sort((a, b) => a.title.localeCompare(b.title)));
    }
    setLoading(false);
  };

  const loadItems = async () => {
    const { data: dbItems } = await supabase.from('setlist_items').select('*').eq('setlist_id', id).order('order_index', { ascending: true });
    if (dbItems) {
      setOrderedItems(dbItems);
      setAddedSongIds(new Set(dbItems.filter(i => i.item_type !== "divider").map(i => i.song_id)));
    }
  };

  const handleUpdateField = async (field, value) => {
    await supabase.from('setlists').update({ [field]: value || null }).eq('id', id);
  };

  const toggleSong = async (songId) => {
    const existingItem = orderedItems.find(i => i.song_id === songId && i.item_type !== "divider");
    if (existingItem) {
      await supabase.from('setlist_items').delete().eq('id', existingItem.id);
    } else {
      await supabase.from('setlist_items').insert([{
        setlist_id: id,
        song_id: songId,
        order_index: orderedItems.length,
        item_type: "song"
      }]);
    }
    loadItems();
  };

  const addDivider = async () => {
    await supabase.from('setlist_items').insert([{
      setlist_id: id,
      order_index: orderedItems.length,
      item_type: "divider",
      content: "NOVA SESSÃO"
    }]);
    loadItems();
  };

  const handleDividerChange = (itemId, text) => {
    setOrderedItems(prev => prev.map(i => i.id === itemId ? { ...i, content: text } : i));
  };

  const commitDividerText = async (itemId, text) => {
    await supabase.from('setlist_items').update({ content: text }).eq('id', itemId);
  };

  const handleNotesChange = (itemId, text) => {
    setOrderedItems(prev => prev.map(i => i.id === itemId ? { ...i, performance_notes: text } : i));
  };

  const commitNotes = async (itemId, text) => {
    await supabase.from('setlist_items').update({ performance_notes: text }).eq('id', itemId);
  };

  const deleteDivider = async (itemId) => {
    await supabase.from('setlist_items').delete().eq('id', itemId);
    loadItems();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const newOrder = [...orderedItems];
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setOrderedItems(newOrder);

    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i].order_index !== i) {
        await supabase.from('setlist_items').update({ order_index: i }).eq('id', newOrder[i].id);
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remover este setlist definitivamente?")) return;
    await supabase.from('setlists').delete().eq('id', id);
    navigate("/");
  };

  const handleShareClick = () => {
    // GUARDA-COSTAS: Compartilhamento exige plano PRO
    if (plan !== 'pro') {
      setIsPaywallOpen(true);
      return;
    }
    const link = `${window.location.origin}/join-setlist/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const songCount = orderedItems.filter(i => i.item_type !== "divider").length;
  const songMap = Object.fromEntries(songs.map(s => [s.id, s]));

  const filteredSongs = songs.filter(s => {
    const q = search.toLowerCase();
    const match = s.title.toLowerCase().includes(q) || (s.artist || "").toLowerCase().includes(q);
    if (showOnlyAdded) return addedSongIds.has(s.id) && match;
    return match;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("/")} className="w-12 h-12 flex items-center justify-center -ml-3 text-foreground hover:opacity-60 active:scale-95 transition-all">
          <ArrowLeft size={22} className="pointer-events-none" />
        </button>
        <div className="flex items-center gap-2">
          
          {/* GUARDA-COSTAS: Botão de PDF só renderiza o download real se for PRO, senão abre o paywall */}
          {plan === 'pro' ? (
            <PDFDownloadLink
              document={<SetlistPdfDocument eventName={eventName} bandName={bandName} date={date} orderedItems={orderedItems} songMap={songMap} />}
              fileName={`Setlist_${(eventName || 'setlist').replace(/\s+/g, '_')}.pdf`}
              className="w-11 h-11 flex items-center justify-center text-foreground hover:opacity-60"
            >
              {({ loading: pdfLoading }) => <Printer size={20} className={pdfLoading ? 'opacity-40 animate-pulse' : ''} />}
            </PDFDownloadLink>
          ) : (
            <button onClick={() => setIsPaywallOpen(true)} className="w-11 h-11 flex items-center justify-center text-foreground hover:opacity-60">
              <Printer size={20} />
            </button>
          )}
          
          <button onClick={handleShareClick} className="w-11 h-11 flex items-center justify-center text-foreground hover:opacity-60 relative">
            <Share2 size={20} className="pointer-events-none" />
            {copied && <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded-lg">Copiado!</span>}
          </button>
          
          <button onClick={handleDelete} className="w-11 h-11 flex items-center justify-center text-red-400 hover:opacity-60">
            <Trash2 size={20} className="pointer-events-none" />
          </button>
        </div>
      </div>

      <div className="mb-5 space-y-2">
        <input
          type="text" value={eventName} onChange={e => setEventName(e.target.value)} onBlur={e => handleUpdateField('event_name', e.target.value)}
          placeholder="NOME DO EVENTO" className="w-full text-xl font-black uppercase tracking-tight bg-transparent border-b-4 border-black py-1 outline-none"
        />
        <input
          type="text" value={bandName} onChange={e => setBandName(e.target.value)} onBlur={e => handleUpdateField('band_name', e.target.value)}
          placeholder="Nome da Banda" className="w-full text-sm font-bold uppercase tracking-widest bg-transparent border-b-2 border-black/30 py-1 outline-none"
        />
        <input
          type="date" value={date} onChange={e => { setDate(e.target.value); handleUpdateField('date', e.target.value); }}
          className="text-xs font-bold text-black/50 bg-transparent border-b-2 border-black/20 py-1 outline-none"
        />
      </div>

      <div className="flex gap-1 mb-4 border-2 border-black rounded-xl p-1">
        <button onClick={() => setTab("select")} className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest ${tab === "select" ? "bg-black text-white" : "text-black/40"}`}>SELECIONAR</button>
        <button onClick={() => setTab("order")} className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest ${tab === "order" ? "bg-black text-white" : "text-black/40"}`}>ORDENAR</button>
      </div>

      {tab === "select" && (
        <>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR MÚSICA" className="w-full pl-9 pr-4 py-2.5 bg-transparent border-2 border-black/20 rounded-xl text-xs font-bold outline-none" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowOnlyAdded(!showOnlyAdded)} className="flex items-center gap-2 text-xs font-bold text-foreground">
              {showOnlyAdded ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} Somente adicionadas
            </button>
          </div>
          <div className="space-y-2 pb-20">
            {filteredSongs.map(song => {
              const added = addedSongIds.has(song.id);
              return (
                <div key={song.id} className="flex items-center justify-between px-4 py-4 border-b-2 border-black/10">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm uppercase tracking-tight text-black truncate">{song.title}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/50 truncate">{song.artist}</p>
                  </div>
                  <button onClick={() => toggleSong(song.id)} className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${added ? "bg-black/20 text-black border-2 border-black/20" : "bg-black text-white"}`}>
                    {added ? <Minus size={16} /> : <Plus size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "order" && (
        <div className="pb-20">
          <button onClick={addDivider} className="w-full mb-4 flex items-center justify-center gap-2 min-h-[48px] border-2 border-dashed border-black/30 rounded-xl text-xs font-bold tracking-widest text-black/40">
            <SplitSquareVertical size={14} /> ADICIONAR DIVISOR
          </button>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="setlist-order">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {orderedItems.map((item, idx) => {
                    const isDivider = item.item_type === "divider";
                    const song = isDivider ? null : songMap[item.song_id];
                    return (
                      <Draggable key={item.id} draggableId={item.id} index={idx}>
                        {(provided, snapshot) => (
                          isDivider ? (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="flex flex-col items-center py-2 w-full gap-2">
                              <div className="border-2 border-black rounded-full px-4 py-2 flex items-center gap-2 w-full group">
                                <div {...provided.dragHandleProps} className="text-black/30 cursor-grab"><GripVertical size={14} /></div>
                                <input type="text" maxLength={40} value={item.content || ""} onChange={e => handleDividerChange(item.id, e.target.value)} onBlur={e => commitDividerText(item.id, e.target.value)} className="bg-transparent text-center font-black text-xs uppercase flex-1 outline-none" />
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                     <button
                                       onClick={() => {
                                         // GUARDA-COSTAS: Notas de Divisor exigem pelo menos plano BASIC (bloqueia o free)
                                         if (plan === 'free') {
                                           setIsPaywallOpen(true);
                                           return;
                                         }
                                         if (editingNotesId === item.id) {
                                           commitNotes(item.id, item.performance_notes || "");
                                           setEditingNotesId(null);
                                         } else {
                                           setEditingNotesId(item.id);
                                         }
                                       }}
                                       className={`w-10 h-10 flex items-center justify-center rounded-lg ${editingNotesId === item.id ? 'text-green-600 bg-green-50' : 'text-black/30'}`}
                                     >
                                       {editingNotesId === item.id ? <Check size={14} /> : <Pencil size={14} />}
                                     </button>
                                     <button onClick={() => { if (window.confirm("Remover este divisor?")) deleteDivider(item.id); }} className="w-10 h-10 flex items-center justify-center rounded-lg text-black/30 hover:text-red-500">
                                       <Trash2 size={14} />
                                     </button>
                                </div>
                              </div>
                              {editingNotesId === item.id && (
                                <div className="w-full px-2">
                                  <textarea rows={3} placeholder="Notas de performance (ex: Trocar guitarra...)" value={item.performance_notes || ""} onChange={e => handleNotesChange(item.id, e.target.value)} onBlur={e => commitNotes(item.id, e.target.value)} className="w-full bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-4 py-3 text-sm outline-none resize-none" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-b-2 ${snapshot.isDragging ? "bg-white border-black border-2" : "border-black/10"}`}>
                               <div className="flex-1 min-w-0">
                                 <p className="font-black text-sm uppercase text-black truncate">{song?.title || "Música Deletada"}</p>
                                 <p className="text-xs font-bold uppercase text-black/50 truncate">{song?.artist || "—"}</p>
                               </div>
                               <div {...provided.dragHandleProps} className="p-1 text-black/20 cursor-grab"><GripVertical size={18} /></div>
                            </div>
                          )
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
    </div>
  );
}