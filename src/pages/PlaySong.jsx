import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, ChevronLeft, ChevronRight, X, Settings, ListMusic, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PlaySong() {
  const { id, songIndex } = useParams();
  const navigate = useNavigate();
  
  const [songs, setSongs] = useState([]);
  const [setlistName, setSetlistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSetlistOpen, setIsSetlistOpen] = useState(false);
  const [fontSize, setFontSize] = useState(48);
  
  const currentIndex = parseInt(songIndex, 10) || 0;
  const contentRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn(`⚠️ Wake Lock ignorado pelo navegador: ${err.message}`);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAutoScroll();
    };
  }, []);

  useEffect(() => {
    stopAutoScroll();
    setIsPlaying(false);
    setIsMenuOpen(false);
    setIsSetlistOpen(false);
    window.scrollTo(0, 0);
  }, [currentIndex]);

  useEffect(() => {
    const loadSetlistAndSongs = async () => {
      setLoading(true);
      try {
        if (!id) throw new Error("ID do setlist não encontrado.");

        const { data: setlistData } = await supabase
          .from('setlists')
          .select('event_name')
          .eq('id', id)
          .maybeSingle();
          
        if (setlistData) setSetlistName(setlistData.event_name);

        const { data: pivotData, error } = await supabase
          .from('setlist_items')
          .select(`id, item_type, content, performance_notes, order_index, songs ( * )`)
          .eq('setlist_id', id)
          .order('order_index', { ascending: true });

        if (error) throw error;

        if (pivotData) {
          const formattedItems = pivotData.map(item => {
            if (item.item_type === 'divider') {
              
              // VISUAL LIMPO PARA O DIVISOR
              let dividerText = `[ ${item.content || 'PAUSA'} ]`;
              if (item.performance_notes) {
                dividerText += `\n\n${item.performance_notes}`;
              }

              return {
                id: item.id,
                title: `[ ${item.content || 'DIVISOR'} ]`,
                isSeparator: true,
                lyrics_text: dividerText
              };
            } 
            else if (item.item_type === 'song' && item.songs) {
              return item.songs;
            }
            return null;
          }).filter(Boolean);
          
          setSongs(formattedItems);
        }
      } catch (error) {
        console.error("🚨 Erro ao carregar o modo performance:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSetlistAndSongs();
  }, [id]);

  const togglePlay = () => {
    if (isPlaying) stopAutoScroll();
    else startAutoScroll();
    setIsPlaying(!isPlaying);
  };

  const startAutoScroll = () => {
    scrollIntervalRef.current = setInterval(() => { window.scrollBy({ top: 1, behavior: 'auto' }); }, 50);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
  };

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < songs.length) {
      navigate(`/setlists/${id}/play/${newIndex}`);
    }
  };

  const formatNavName = (name) => {
    if (!name) return "";
    const cleaned = name.trim().toUpperCase();
    return cleaned.length <= 6 ? cleaned : cleaned.substring(0, 6) + "..";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="mb-6 font-bold text-white/50 uppercase tracking-widest text-sm">
          Nenhuma música encontrada ou erro ao carregar.
        </p>
        <button onClick={() => navigate('/setlists')} className="px-6 py-3 bg-white text-black font-black uppercase rounded-xl">
          Voltar aos Setlists
        </button>
      </div>
    );
  }

  const currentSong = songs[currentIndex];
  const prevSong = songs[currentIndex - 1];
  const nextSong = songs[currentIndex + 1];
  const songText = currentSong?.lyrics_text || currentSong?.lyrics || currentSong?.content || currentSong?.text || currentSong?.body;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      
      {/* Cabeçalho */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black via-black/90 to-transparent pt-6 pb-12 px-6 z-40 flex items-start justify-between pointer-events-none">
        <div className="w-2/3">
          <h1 className={`text-2xl font-black uppercase tracking-tight drop-shadow-lg leading-none truncate ${currentSong.isSeparator ? 'text-yellow-400' : 'text-white'}`}>
            {currentSong?.title}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 truncate">{setlistName} • {currentIndex + 1}/{songs.length}</p>
        </div>
        
        {/* BOTÕES DE TOPO */}
        <div className="flex gap-2 pointer-events-auto shrink-0">
          <button 
            onClick={() => setIsSetlistOpen(true)} 
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center border border-transparent hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <ListMusic size={18} className="ml-0.5" />
          </button>

          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/setlists')} 
            className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* OVERLAY 1: SETLIST TELA CHEIA */}
      {isSetlistOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fadeIn">
          <div className="pt-8 pb-4 px-6 flex justify-between items-center border-b border-white/10 bg-black z-10 shadow-xl">
            <div className="w-3/4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-white leading-none">Repertório</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 truncate">{setlistName}</p>
            </div>
            <button 
              onClick={() => setIsSetlistOpen(false)} 
              className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors shrink-0"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 pb-24">
            {songs.map((song, idx) => (
              <button 
                key={song.id || idx}
                onClick={() => handleNavigate(idx)}
                className={`w-full text-left p-5 sm:p-8 rounded-2xl flex items-center gap-4 transition-transform active:scale-95 ${
                  idx === currentIndex 
                    ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                    : song.isSeparator 
                      ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-500/20'
                      : 'bg-[#111] text-white hover:bg-[#1a1a1a] border border-white/5'
                }`}
              >
                <span className={`text-xl sm:text-2xl font-black tracking-tighter shrink-0 ${idx === currentIndex ? 'text-black/30' : song.isSeparator ? 'text-yellow-500/50' : 'text-white/20'}`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-xl sm:text-3xl font-black uppercase tracking-tight truncate">
                  {song.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAY 2: Menu de Configurações */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 flex justify-end animate-fadeIn">
          <div className="w-80 bg-neutral-900 h-full border-l border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black uppercase tracking-widest text-sm">Opções de Palco</h3>
              <button onClick={() => setIsMenuOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2"><Type size={14}/> Tamanho da Letra</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(prev => Math.max(20, prev - 4))} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl hover:bg-neutral-700 active:scale-95">-</button>
                <div className="flex-1 text-center font-black text-xl">{fontSize}px</div>
                <button onClick={() => setFontSize(prev => Math.min(100, prev + 4))} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl hover:bg-neutral-700 active:scale-95">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área da Letra */}
      <div ref={contentRef} className="pt-40 pb-40 px-6 max-w-4xl mx-auto w-full">
        <pre 
          className={`whitespace-pre-wrap break-words font-black uppercase leading-relaxed tracking-tight w-full flex flex-col justify-center items-center ${currentSong.isSeparator ? 'text-yellow-400 text-center min-h-[40vh]' : 'text-white/90'}`}
          style={{ fontSize: `${fontSize}px`, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {songText || (currentSong.isSeparator ? "" : "NENHUMA LETRA CADASTRADA PARA ESTA MÚSICA.")}
        </pre>
      </div>

      {/* Controles de Play/Navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 p-3 pb-6 sm:pb-3 flex items-center justify-between gap-3 z-30">
        <div className="flex-1 w-1/3">
          {prevSong ? (
            <button onClick={() => handleNavigate(currentIndex - 1)} className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase border border-white/5">
              <ChevronLeft size={18} className="shrink-0" /> <span className="truncate">{formatNavName(prevSong.title)}</span>
            </button>
          ) : (
            <button onClick={() => navigate('/setlists')} className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
              <X size={16} /> SAIR
            </button>
          )}
        </div>
        
        {!currentSong.isSeparator ? (
          <button onClick={togglePlay} className="w-24 h-14 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 flex-shrink-0">
            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </button>
        ) : (
          <div className="w-24 h-14 flex-shrink-0" />
        )}

        <div className="flex-1 w-1/3">
          {nextSong ? (
            <button onClick={() => handleNavigate(currentIndex + 1)} className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase border border-white/5">
              <span className="truncate">{formatNavName(nextSong.title)}</span> <ChevronRight size={18} className="shrink-0" />
            </button>
          ) : (
            <button onClick={() => navigate('/setlists')} className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
              FIM <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}