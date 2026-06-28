import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, Play, Archive, ArchiveRestore, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import PaywallModal from "../components/PaywallModal";

// A MÁGICA DO FLICKER: Cache global em memória
let globalSetlistsCache = null;

export default function Setlists() {
  // Já inicia com o cache se existir, matando o flicker na hora!
  const [setlists, setSetlists] = useState(globalSetlistsCache || []);
  const [loading, setLoading] = useState(!globalSetlistsCache);
  const [showArchived, setShowArchived] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  
  const navigate = useNavigate();
  const { user, plan } = useAuth();

  useEffect(() => {
    if (user) loadSetlists();
  }, [user]);

  const formatTotalDuration = (totalSeconds) => {
    if (!totalSeconds) return "0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleCreateNew = async () => {
    if ((plan || 'free') === 'free' && setlists.length >= 1) {
      setIsPaywallOpen(true);
      return;
    }

    const { data, error } = await supabase.from('setlists').insert([{ 
      event_name: "NOVO SETLIST", band_name: "", created_by: user.email, archived: false
    }]).select().single();

    if (!error) navigate(`/setlists/${data.id}/edit`);
  };

  const loadSetlists = async () => {
    if (!globalSetlistsCache) setLoading(true); // Só exibe tela de loading se não tiver cache
    try {
      const { data: memberData } = await supabase.from('setlist_members').select('setlist_id').eq('member_email', user.email);
      const sharedIds = memberData ? memberData.map(m => m.setlist_id) : [];

      let query = supabase.from('setlists').select('*');
      if (sharedIds.length > 0) {
        query = query.or(`created_by.eq.${user.email},id.in.(${sharedIds.join(',')})`);
      } else {
        query = query.eq('created_by', user.email);
      }

      const { data: allSetlists, error } = await query;

      if (!error && allSetlists) {
        const setlistIds = allSetlists.map(sl => sl.id);
        let itemsData = [];
        
        if (setlistIds.length > 0) {
          const { data: items } = await supabase.from('setlist_items').select('setlist_id, item_type, songs(duration_seconds)').in('setlist_id', setlistIds);
          itemsData = items || [];
        }

        const enriched = allSetlists.map(sl => {
          const myItems = itemsData.filter(i => i.setlist_id === sl.id && i.item_type !== 'divider');
          return { 
            ...sl, 
            songCount: myItems.length, 
            totalDurationSeconds: myItems.reduce((acc, curr) => acc + (curr.songs?.duration_seconds || 0), 0),
            isShared: sl.created_by !== user.email
          };
        });

        globalSetlistsCache = enriched; // Salva no cache
        setSetlists(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async (e, id, currentStatus) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    setSetlists(prev => prev.map(sl => sl.id === id ? { ...sl, archived: newStatus } : sl));
    await supabase.from('setlists').update({ archived: newStatus }).eq('id', id);
  };

  const visibleSetlists = setlists.filter(sl => showArchived ? sl.archived === true : !sl.archived);

  const SetlistCard = ({ sl }) => (
    <div className={`bg-white border-2 border-black rounded-3xl p-4 flex flex-col justify-between min-h-[150px] group relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${sl.archived ? 'opacity-60 grayscale' : ''}`}>
      <div className="absolute top-2 right-2 flex items-center z-10">
        <button onClick={(e) => toggleArchive(e, sl.id, sl.archived)} className="w-12 h-12 flex items-center justify-center text-black/30 hover:text-black active:scale-95">
          {sl.archived ? <ArchiveRestore size={22} className="pointer-events-none" /> : <Archive size={22} className="pointer-events-none" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); navigate(`/setlists/${sl.id}/edit`); }} className="w-12 h-12 flex items-center justify-center text-black/30 hover:text-black active:scale-95">
          <Settings size={22} className="pointer-events-none" />
        </button>
      </div>

      <button onClick={() => navigate(`/setlists/${sl.id}/play/0`)} className="flex-1 min-w-0 text-left pt-2">
        <p className="font-black text-sm uppercase tracking-tight text-black leading-tight line-clamp-2 pr-24">{sl.event_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {sl.band_name && <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 truncate">{sl.band_name}</p>}
          {sl.isShared && <span className="bg-green-100 text-green-700 border border-green-200 text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-1 w-fit"><Users size={10} /> Collab</span>}
        </div>
      </button>

      <div className="mt-3">
        {sl.date && <span className="text-[10px] font-black text-black border border-black px-2 py-0.5 rounded-md block w-fit mb-2">{new Date(sl.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-black/50 font-bold uppercase tracking-widest flex items-center gap-1.5">
            {sl.songCount || 0} Músicas • {formatTotalDuration(sl.totalDurationSeconds)}
            {sl.isShared && <Users size={12} className="text-green-600 ml-1" title="Compartilhado" />}
          </span>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/setlists/${sl.id}/play/0`); }} className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 active:scale-95">
            <Play size={13} fill="white" className="pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-6 max-w-4xl mx-auto px-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs tracking-[0.15em] uppercase text-gray-400 mb-0.5">Repertórios</p>
          <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">Setlists</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button onClick={handleCreateNew} className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
            <Plus size={18} className="pointer-events-none" />
          </button>
        </div>
      </div>
      <div className="border-b border-gray-200 mb-5 mt-3" />
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-full max-w-[240px]">
        <button onClick={() => setShowArchived(false)} className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase ${!showArchived ? "bg-white shadow-sm text-foreground" : "text-gray-400"}`}>Ativos</button>
        <button onClick={() => setShowArchived(true)} className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase ${showArchived ? "bg-white shadow-sm text-foreground" : "text-gray-400"}`}>Arquivados</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : visibleSetlists.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">{showArchived ? "Nenhum setlist arquivado." : "Nenhum setlist encontrado."}</p>
          {!showArchived && <button onClick={handleCreateNew} className="px-6 py-4 bg-black text-white text-xs font-black tracking-widest uppercase rounded-xl hover:opacity-80 active:scale-95">Criar primeiro setlist</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
          {visibleSetlists.map(sl => <SetlistCard key={sl.id} sl={sl} />)}
        </div>
      )}
      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
    </div>
  );
}