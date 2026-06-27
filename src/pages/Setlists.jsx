import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, Play } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import PaywallModal from "../components/PaywallModal";

export default function Setlists() {
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
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
    // Se por algum motivo o plano não carregar a tempo, assume free por segurança
    const currentPlan = plan || 'free';

    // GUARDA-COSTAS: Se for Free e já tiver 1 ou mais setlists, bloqueia!
    if (currentPlan === 'free' && setlists.length >= 1) {
      setIsPaywallOpen(true);
      return;
    }

    const { data, error } = await supabase
      .from('setlists')
      .insert([{ 
        event_name: "NOVO SETLIST", 
        band_name: "", 
        created_by: user.email
      }])
      .select()
      .single();

    if (error) {
      alert("Erro ao criar setlist");
      console.error("Erro detalhado do Supabase:", error);
      return;
    }
    navigate(`/setlists/${data.id}/edit`);
  };

  const loadSetlists = async () => {
    setLoading(true);
    try {
      const { data: ownSetlists, error } = await supabase
        .from('setlists')
        .select('*')
        .eq('created_by', user.email);

      if (!error && ownSetlists) {
        const enriched = ownSetlists.map(sl => ({ ...sl, songCount: 0, totalDurationSeconds: 0 }));
        setSetlists(enriched);
      }
    } catch (err) {
      console.error("Erro ao carregar setlists:", err);
    } finally {
      setLoading(false);
    }
  };

  const SetlistCard = ({ sl }) => (
    <div className="bg-white border-2 border-black rounded-3xl p-4 flex flex-col justify-between min-h-[150px] group relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/setlists/${sl.id}/edit`); }}
        className="absolute top-2 right-2 w-12 h-12 flex items-center justify-center text-black/30 hover:text-black transition-all active:scale-95 z-10"
      >
        <Settings size={22} className="pointer-events-none" />
      </button>
      <button onClick={() => navigate(`/setlists/${sl.id}/play/0`)} className="flex-1 min-w-0 text-left">
        <p className="font-black text-sm uppercase tracking-tight text-black leading-tight line-clamp-2 flex items-start gap-1.5 pr-6">
          {sl.event_name}
        </p>
        {sl.band_name && <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 truncate mt-0.5">{sl.band_name}</p>}
      </button>
      <div className="mt-3">
        {sl.date && (
          <span className="text-[10px] font-black text-black border border-black px-2 py-0.5 rounded-md block w-fit mb-2">
            {new Date(sl.date + 'T12:00:00').toLocaleDateString('pt-BR')}
          </span>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-black/50 font-bold uppercase tracking-widest">
            {sl.songCount || 0} • {formatTotalDuration(sl.totalDurationSeconds)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/setlists/${sl.id}/play/0`); }}
            className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity active:scale-95"
          >
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
          <button onClick={handleCreateNew} className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity active:scale-95">
            <Plus size={18} className="pointer-events-none" />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-5 mt-3" />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : setlists.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Nenhum setlist ainda.</p>
          <button onClick={handleCreateNew} className="px-6 py-4 bg-black text-white text-xs font-black tracking-widest uppercase rounded-xl hover:opacity-80 transition-opacity active:scale-95">
            Criar primeiro setlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setlists.map(sl => (
            <SetlistCard key={sl.id} sl={sl} />
          ))}
        </div>
      )}

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
    </div>
  );
}