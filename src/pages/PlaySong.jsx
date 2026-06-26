import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, X, Zap, Square, Play as PlayIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import PaywallModal from "../components/PaywallModal";

const IconPlay = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" className="pointer-events-none"><g transform="matrix(1,0,0,1,0,-150)"><g transform="matrix(2.666667,0,0,2.666667,-4310,-5190.924981)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g><g transform="matrix(0,2.666667,-1.434735,0,2435.044252,-4278.666667)"><path d="M1678.702,1652.596C1678.908,1652.184 1679.197,1651.95 1679.5,1651.95C1679.803,1651.95 1680.092,1652.184 1680.298,1652.596C1681.834,1655.668 1685.232,1662.464 1687.298,1666.596C1687.593,1667.187 1687.672,1668.046 1687.499,1668.784C1687.326,1669.523 1686.934,1670 1686.5,1670C1682.86,1670 1676.14,1700 1672.5,1670C1672.066,1670 1671.674,1669.523 1671.501,1668.784C1671.328,1668.046 1671.407,1667.187 1671.702,1666.596C1673.768,1662.464 1677.166,1655.668 1678.702,1652.596Z" fill="currentColor"/></g></g></svg>
);
const IconPause = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" className="pointer-events-none"><g transform="matrix(2.666667,0,0,2.666667,-83.333333,-83.333333)"><g transform="matrix(1,0,0,1,-1585,-1971.596868)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g><g transform="matrix(1,0,0,1,-1495.055622,-1665)"><g transform="matrix(-1,0,0,1.015806,3166.111244,-27.106898)"><path d="M1619.69,1707.124C1619.861,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.861,1722.876 1619.69,1722.876C1618.944,1722.876 1617.056,1722.876 1616.31,1722.876C1616.139,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.139,1707.124 1616.31,1707.124C1617.056,1707.124 1618.944,1707.124 1619.69,1707.124Z" fill="currentColor"/></g><g transform="matrix(-1,0,0,1.015806,3160,-27.106898)"><path d="M1619.69,1707.124C1619.861,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.861,1722.876 1619.69,1722.876C1618.944,1722.876 1617.056,1722.876 1616.31,1722.876C1616.139,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.139,1707.124 1616.31,1707.124C1617.056,1707.124 1618.944,1707.124 1619.69,1707.124Z" fill="currentColor"/></g></g></g></svg>
);
const IconSetlist = () => (
  <svg viewBox="0 0 100 100" width="36" height="36" className="pointer-events-none"><g transform="matrix(1,0,0,1,-300,0)"><g transform="matrix(2.666667,0,0,2.666667,-583.333333,-83.333333)"><g transform="matrix(1,0,0,1,-1285,-1971.596868)"><circle cx="1635" cy="2021.597" r="15" fill="white"/></g><g transform="matrix(1,0,0,1,-1223.5,-1665.5)"><g transform="matrix(-0,0.5,1.015806,-0,-167.106898,902)"><path d="M1619.379,1707.124C1619.722,1707.124 1620,1707.261 1620,1707.43C1620,1709.425 1620,1720.575 1620,1722.57C1620,1722.739 1619.722,1722.876 1619.379,1722.876C1618.629,1722.876 1617.371,1722.876 1616.621,1722.876C1616.278,1722.876 1616,1722.739 1616,1722.57C1616,1720.575 1616,1709.425 1616,1707.43C1616,1707.261 1616.278,1707.124 1616.621,1707.124C1617.371,1707.124 1618.629,1707.124 1619.379,1707.124Z" fill="black"/></g></g></g></g></svg>
);

export default function PlaySong() {
  const { id, songIndex } = useParams();
  const navigate = useNavigate();
  const { user, plan } = useAuth();

  const [setlist, setSetlist] = useState(null);
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(parseInt(songIndex) || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showList, setShowList] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  
  const [fontSize] = useState(() => parseInt(localStorage.getItem("ls_fontSize") || "24"));
  const [lineHeight] = useState(() => parseFloat(localStorage.getItem("ls_lineHeight") || "1.8"));
  const [isAutoPlay, setIsAutoPlay] = useState(() => localStorage.getItem("ls_autoPlay") === "true");

  const wakeLockRef = useRef(null);
  const lyricsRef = useRef(null);
  const scrollInterval = useRef(null);
  const startTime = useRef(null);
  const touchStartY = useRef(null);

  const currentItem = items[currentIdx];
  const isDivider = currentItem?.item_type === "divider";
  const currentSong = isDivider ? null : currentItem;

  useEffect(() => {
    if (user && id) loadData();
  }, [id, user]);

  const loadData = async () => {
    const { data: sl } = await supabase.from('setlists').select('*').eq('id', id).single();
    setSetlist(sl);

    const { data: setlistItems } = await supabase.from('setlist_items').select('*').eq('setlist_id', id).order('order_index', { ascending: true });
    const songIds = (setlistItems || []).filter(i => i.item_type !== 'divider').map(i => i.song_id);
    const { data: songsData } = await supabase.from('songs').select('*').in('id', songIds);
    const songMap = Object.fromEntries((songsData || []).map(s => [s.id, s]));

    const mixed = (setlistItems || []).map(item => {
      if (item.item_type === "divider") return { item_type: "divider", id: item.id, content: item.content || "", performance_notes: item.performance_notes || "" };
      const song = songMap[item.song_id];
      return song ? { ...song, item_type: "song" } : null;
    }).filter(Boolean);

    setItems(mixed);
  };

  const stopScroll = useCallback(() => {
    setIsPlaying(false);
    if (scrollInterval.current) { cancelAnimationFrame(scrollInterval.current); scrollInterval.current = null; }
  }, []);

  const startScroll = useCallback(() => {
    if (!lyricsRef.current || !currentSong || isDivider) return;
    const container = lyricsRef.current;
    const sh = container.scrollHeight - container.clientHeight;
    if (sh <= 0) return;

    const currentScroll = container.scrollTop;
    if (!currentSong.duration_seconds) return;
    const durationMs = currentSong.duration_seconds * 1000;
    startTime.current = performance.now() - (currentScroll / sh * durationMs);
    
    const animate = (now) => {
      const elapsedMs = now - startTime.current;
      const progress = Math.min(elapsedMs / durationMs, 1);
      container.scrollTop = sh * progress;
      setElapsed(Math.floor(elapsedMs / 1000));
      if (progress < 1) scrollInterval.current = requestAnimationFrame(animate);
      else setIsPlaying(false);
    };
    scrollInterval.current = requestAnimationFrame(animate);
    setIsPlaying(true);
  }, [currentSong, isDivider]);

  const handlePlayStop = () => { if (isDivider) return; if (isPlaying) stopScroll(); else startScroll(); };

  const handleToggleAutoPlay = () => {
    // GUARDA-COSTAS: Auto-play exige plano PRO!
    if (plan !== 'pro') {
      stopScroll();
      setIsPaywallOpen(true);
      return;
    }
    const nextVal = !isAutoPlay;
    setIsAutoPlay(nextVal);
    localStorage.setItem("ls_autoPlay", String(nextVal));
  };

  const goToSong = (idx) => {
    stopScroll(); setCurrentIdx(idx); setElapsed(0); setShowList(false);
    navigate(`/setlists/${id}/play/${idx}`, { replace: true });
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const totalDuration = currentSong?.duration_seconds || 0;

  useEffect(() => {
    if (isAutoPlay && plan === 'pro' && !isDivider && totalDuration > 0 && elapsed >= totalDuration) {
      if (currentIdx < items.length - 1) setTimeout(() => goToSong(currentIdx + 1), 1500);
    }
  }, [elapsed, totalDuration, isAutoPlay, plan, currentIdx, items, isDivider]);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden z-50">
      <div className="flex-shrink-0 px-4">
        <div className="flex items-center justify-between py-3">
          <button onClick={() => { stopScroll(); navigate(-1); }} className="w-14 h-14 flex items-center justify-center text-white/50 hover:text-white"><ChevronLeft size={32} /></button>
          <div className="flex items-center gap-3">
            {!isDivider && <p className={`text-base font-black tabular-nums ${isPlaying ? 'text-[#00FF00]' : 'text-red-500'}`}>{formatTime(elapsed)} / {formatTime(totalDuration)}</p>}
            <button onClick={handleToggleAutoPlay} className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAutoPlay && plan === 'pro' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/40'}`}><Zap size={20} /></button>
            <button onClick={() => setShowList(!showList)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black"><IconSetlist /></button>
          </div>
        </div>
        <div className="border-b border-white/10" />
        <div className="flex items-center justify-between py-3">
          <h2 className="text-xl font-black uppercase truncate">{isDivider ? currentItem?.content : currentSong?.title}</h2>
          <span className="text-sm text-white/40 font-bold">{currentIdx + 1}/{items.length}</span>
        </div>
      </div>

      {isDivider ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="border-4 border-white/20 rounded-3xl p-10 mb-8"><h2 className="text-4xl font-black uppercase">{currentItem?.content}</h2></div>
          {currentItem?.performance_notes && <div className="max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6"><p className="text-white text-xl font-medium">{currentItem.performance_notes}</p></div>}
        </div>
      ) : (
        <div ref={lyricsRef} className="flex-1 overflow-y-auto px-4 py-2 relative">
          <div className="whitespace-pre-wrap font-sans text-white leading-relaxed pt-[64px] pb-[50vh]" style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}>
            {currentSong?.lyrics_text || "Sem letra cadastrada."}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 px-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => currentIdx > 0 && goToSong(currentIdx - 1)} disabled={currentIdx === 0} className="flex-1 min-h-[56px] bg-white/10 rounded-2xl text-xs font-bold disabled:opacity-20">VOLTAR</button>
          <div className="w-20 flex-shrink-0 flex items-center justify-center">
            {!isDivider && <button onClick={handlePlayStop} className={`w-full h-14 rounded-2xl flex items-center justify-center ${isPlaying ? 'bg-[#00FF00]' : 'bg-red-600'}`}>{isPlaying ? 'PAUSE' : 'PLAY'}</button>}
          </div>
          <button onClick={() => currentIdx < items.length - 1 && goToSong(currentIdx + 1)} disabled={currentIdx >= items.length - 1} className="flex-1 min-h-[56px] bg-white/10 rounded-2xl text-xs font-bold disabled:opacity-20">PRÓXIMA</button>
        </div>
      </div>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
    </div>
  );
}