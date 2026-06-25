import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { ArrowLeft, Plus, Minus, GripVertical, Trash2, Search, ToggleLeft, ToggleRight, Share2, Printer, SplitSquareVertical, Pencil, Check, Archive } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SetlistPdfDocument } from '../components/SetlistPdfDocument';

export default function SetlistEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventName, setEventName] = useState("");
  const [bandName, setBandName] = useState("");
  const [date, setDate] = useState("");
  
  const [songs, setSongs] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [addedSongIds, setAddedSongIds] = useState(new Set());
  
  const [search, setSearch] = useState("");
  const [showOnlyAdded, setShowOnlyAdded] = useState(false);
  const [sortOrder, setSortOrder] = useState("az");
  const [tab, setTab] = useState("select");
  
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && id) loadData();
  }, [id, user]);

  const loadData = async () => {
    setLoading(true);

    // 1. Pega os dados do Setlist
    const { data: sl } = await supabase.from('setlists').select('*').eq('id', id).single();
    if (sl) {
      setEventName(sl.event_name || "");
      setBandName(sl.band_name || "");
      setDate(sl.date || "");
    }

    // 2. Pega os Itens do Setlist
    const { data: dbItems } = await supabase.from('setlist_items').select('*').eq('setlist_id', id).order('order_index', { ascending: true });
    if (dbItems) {
      setOrderedItems(dbItems);
      setAddedSongIds(new Set(dbItems.filter(i => i.item_type !== "divider").map(i => i.song_id)));
    }

    // 3. Pega as Músicas (Por enquanto, apenas as do próprio usuário)
    const { data: ownSongs } = await supabase.from('songs').select('*').eq('created_by', user.email);
    if (ownSongs) {
      setSongs(ownSongs.sort((a, b) => a.title.localeCompare(b.title)));
    }

    setLoading(false);
  };

  // Recarrega apenas os itens (usado após adicionar/remover)
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

    // Atualiza a ordem no banco
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

  const handleShare = () => {
    const link = `${window.location.origin}/join-setlist/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const songCount = orderedItems.filter(i => i.item_type !== "divider").length;
  const songMap = Object.fromEntries(songs.map(s => [s.id, s]));

  const filteredSongs = songs
    .filter(s => {
      const q = search.toLowerCase();
      const match = s.title.toLowerCase().includes(q) || (s.artist || "").toLowerCase().includes(q);
      if (showOnlyAdded) return addedSongIds.has(s.id) && match;
      return match;
    })
    .sort((a, b) => {
      if (sortOrder === "az") return a.title.localeCompare(b.title);
      if (sortOrder === "za") return b.title.localeCompare(a.title);
      if (sortOrder === "recent") return new Date(b.created_date) - new Date(a.created_date);
      return 0;
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
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("/")} className="w-12 h-12 flex items-center justify-center -ml-3 text-foreground hover:opacity-60 active:opacity-40 active:scale-95 transition-all">
          <ArrowLeft size={22} className="pointer-events-none" />
        </button>
        <div className="flex items-center gap-2">
          
          {/* Botão de PDF Real e Conectado */}
          <PDFDownloadLink
            document={
              <SetlistPdfDocument
                eventName={eventName}
                bandName={bandName}
                date={date}
                orderedItems={orderedItems}
                songMap={songMap}
              />
            }
            fileName={`Setlist_${(eventName || 'setlist').replace(/\s+/g, '_')}.pdf`}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:opacity-60 transition-opacity active:scale-95 transition-transform"
            title="Baixar PDF do Setlist"
          >
            {({ loading: pdfLoading }) => (
              <Printer size={20} className={pdfLoading ? 'opacity-40 animate-pulse' : ''} />
            )}
          </PDFDownloadLink>
          
          <button onClick={handleShare} className="w-11 h-11 flex items-center justify-center text-foreground hover:opacity-60 transition-opacity active:scale-95 transition-transform relative" title="Copiar link de convite">
            <Share2 size={20} className="pointer-events-none" />
            {copied && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
                Copiado!
              </span>
            )}
          </button>
          
          <button onClick={handleDelete} className="w-11 h-11 flex items-center justify-center text-red-400 hover:opacity-60 transition-opacity active:scale-95 transition-transform">
            <Trash2 size={20} className="pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Setlist Info */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Editar Setlist</p>
        </div>
        
        <input
          type="text" value={eventName}
          onChange={e => setEventName(e.target.value)}
          onBlur={e => handleUpdateField('event_name', e.target.value)}
          placeholder="NOME DO EVENTO"
          className="w-full text-xl font-black uppercase tracking-tight bg-transparent border-b-4 border-black py-1 outline-none placeholder-black/20"
        />
        <input
          type="text" value={bandName}
          onChange={e => setBandName(e.target.value)}
          onBlur={e => handleUpdateField('band_name', e.target.value)}
          placeholder="Nome da Banda"
          className="w-full text-sm font-bold uppercase tracking-widest bg-transparent border-b-2 border-black/30 py-1 outline-none placeholder-black/20 focus:border-black"
        />
        <input
          type="date" value={date}
          onChange={e => { setDate(e.target.value); handleUpdateField('date', e.target.value); }}
          className="text-xs font-bold text-black/50 bg-transparent border-b-2 border-black/20 py-1 outline-none focus:border-black"
        />
      </div>

      {/* Added count */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-black text-black">{songCount}</span>
        <span className="text-xs tracking-[0.15em] uppercase font-bold text-black/40">ADICIONADAS</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-2 border-black rounded-xl p-1">
        <button
          onClick={() => setTab("select")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${tab === "select" ? "bg-black text-white" : "text-black/40 hover:text-black"}`}
        >
          SELECIONAR
        </button>
        <button
          onClick={() => setTab("order")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest transition-all ${tab === "order" ? "bg-black text-white" : "text-black/40 hover:text-black"}`}
        >
          ORDENAR
        </button>
      </div>

      {tab === "select" && (
        <>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="BUSCAR MÚSICA"
              className="w-full pl-9 pr-4 py-2.5 bg-transparent border-2 border-black/20 rounded-xl text-xs tracking-widest font-bold outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowOnlyAdded(!showOnlyAdded)}
              className="flex items-center gap-2 min-h-[44px] text-xs font-bold text-foreground hover:opacity-60 transition-opacity active:scale-95 transition-transform"
            >
              {showOnlyAdded ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {showOnlyAdded ? "Mostrar toda biblioteca" : "Somente adicionadas"}
            </button>
          </div>

          <div className="space-y-2 pb-20">
            {filteredSongs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Você ainda não tem músicas.
                </div>
            ) : null}
            {filteredSongs.map(song => {
              const added = addedSongIds.has(song.id);
              return (
                <div key={song.id} className="flex items-center justify-between px-4 py-4 border-b-2 border-black/10 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm uppercase tracking-tight text-black truncate">{song.title}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-black/50 truncate">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => toggleSong(song.id)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all active:scale-95 ${added ? "bg-black/20 text-black border-2 border-black/20" : "bg-black text-white"}`}
                  >
                    {added ? <Minus size={16} className="pointer-events-none" /> : <Plus size={16} className="pointer-events-none" />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "order" && (
        <div className="pb-20">
          <button
            onClick={addDivider}
            className="w-full mb-4 flex items-center justify-center gap-2 min-h-[48px] border-2 border-dashed border-black/30 rounded-xl text-xs font-bold tracking-widest text-black/40 hover:border-black hover:text-black transition-colors active:scale-[0.98] transition-transform"
          >
            <SplitSquareVertical size={14} className="pointer-events-none" />
            <span className="pointer-events-none">ADICIONAR DIVISOR</span>
          </button>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="setlist-order">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {(() => {
                    let songNum = 0;
                    return orderedItems.map((item, idx) => {
                      const isDivider = item.item_type === "divider";
                      if (!isDivider) songNum++;
                      const displayNum = songNum;
                      const song = isDivider ? null : songMap[item.song_id];
                      
                      return (
                        <Draggable key={item.id} draggableId={item.id} index={idx}>
                          {(provided, snapshot) => (
                            isDivider ? (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="flex flex-col items-center py-2 w-full gap-2">
                                <div className="border-2 border-black rounded-full px-4 py-2 flex items-center gap-2 w-full group">
                                  <div {...provided.dragHandleProps} className="text-black/30 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={14} />
                                  </div>
                                  <input
                                    type="text" maxLength={40} value={item.content || ""}
                                    onChange={e => handleDividerChange(item.id, e.target.value)}
                                    onBlur={e => commitDividerText(item.id, e.target.value)}
                                    className="bg-transparent border-none outline-none font-black text-xs uppercase tracking-widest text-center text-black flex-1 min-w-0"
                                  />
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button
                                         onClick={() => {
                                           if (editingNotesId === item.id) {
                                             commitNotes(item.id, item.performance_notes || "");
                                             setEditingNotesId(null);
                                           } else {
                                             setEditingNotesId(item.id);
                                           }
                                         }}
                                         className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${editingNotesId === item.id ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-black/30 hover:text-black hover:bg-black/5'}`}
                                       >
                                         {editingNotesId === item.id ? <Check size={14} className="pointer-events-none" /> : <Pencil size={14} className="pointer-events-none" />}
                                       </button>
                                       <button onClick={() => { if (window.confirm("Remover este divisor?")) deleteDivider(item.id); }} className="w-10 h-10 flex items-center justify-center rounded-lg text-black/30 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all">
                                         <Trash2 size={14} className="pointer-events-none" />
                                       </button>
                                  </div>
                                </div>
                                {editingNotesId === item.id && (
                                  <div className="w-full px-2">
                                    <textarea
                                      rows={3} placeholder="Notas de performance (ex: Trocar guitarra...)"
                                      value={item.performance_notes || ""}
                                      onChange={e => handleNotesChange(item.id, e.target.value)}
                                      onBlur={e => commitNotes(item.id, e.target.value)}
                                      className="w-full bg-yellow-50 border-2 border-yellow-300 rounded-2xl px-4 py-3 text-sm outline-none resize-none placeholder-yellow-400 text-black focus:border-yellow-500"
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all border-b-2 ${snapshot.isDragging ? "bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2" : "border-black/10"}`}>
                                 <span className="text-lg font-black text-black/20 w-7 text-right flex-shrink-0">{displayNum}</span>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-black text-sm uppercase tracking-tight text-black truncate">{song?.title || "Música Deletada"}</p>
                                   <p className="text-xs font-bold uppercase tracking-widest text-black/50 truncate">{song?.artist || "—"}</p>
                                 </div>
                                 <div {...provided.dragHandleProps} className="p-1 text-black/20 cursor-grab active:cursor-grabbing">
                                  <GripVertical size={18} />
                                </div>
                              </div>
                            )
                          )}
                        </Draggable>
                      );
                    });
                  })()}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}