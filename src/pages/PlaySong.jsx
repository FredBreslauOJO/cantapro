import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Pause, ChevronLeft, ChevronRight,
  Monitor, ZoomIn, ZoomOut, Save, RefreshCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';

const FONT_FAMILIES = {
  'sans': 'font-sans',
  'serif': 'font-serif',
  'mono': 'font-mono'
};

const FONT_SIZES = [
  'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 
  'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'
];

export default function PlaySong() {
  const { id, songIndex } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [setlist, setSetlist] = useState(null);
  const [songs, setSongs] = useState([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeBlockIndex, setActiveBlockIndex] = useState(-1);
  const [scrolling, setScrolling] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [fontFamily, setFontFamily] = useState('sans');
  const [fontSizeIndex, setFontSizeIndex] = useState(3);
  const [highContrast, setHighContrast] = useState(true);
  
  const [autoAdvance, setAutoAdvance] = useState(false); 
  const [advanceDelay, setAdvanceDelay] = useState(5);

  const containerRef = useRef(null);
  const playIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const wakeLockRef = useRef(null);
  const isDraggingRef = useRef(false);

  const safeSongIndex = Math.max(0, parseInt(songIndex) || 0);

  useEffect(() => {
    loadSetlistAndPreferences();
    requestWakeLock();
    return () => releaseWakeLock();
  }, [id]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const loadSetlistAndPreferences = async () => {
    try {
      if (!navigator.onLine || sessionStorage.getItem('canta_force_offline') === 'true') {
        const cachedKeys = Object.keys(localStorage).filter(k => k.startsWith('canta_setlists_offline_'));
        let found = null;
        for (let key of cachedKeys) {
          const parsed = JSON.parse(localStorage.getItem(key));
          const sl = parsed.find(s => s.id === id);
          if (sl) {
            found = sl;
            break;
          }
        }
        if (found) {
           setSetlist(found);
           setSongs([]); 
        }
      } else {
        const { data: slData } = await supabase.from('setlists').select('*').eq('id', id).single();
        if (slData) setSetlist(slData);

        const { data: itemsData } = await supabase
          .from('setlist_items')
          .select('*, songs(*)')
          .eq('setlist_id', id)
          .order('order_index', { ascending: true });

        if (itemsData) {
          const onlySongs = itemsData.filter(i => i.item_type === 'song' && i.songs);
          const formattedSongs = onlySongs.map(item => ({
            id: item.songs.id,
            title: item.songs.title,
            artist: item.songs.artist,
            duration: item.songs.duration_seconds || 0,
            text: item.songs.lyrics_text || "",
            blocks: item.songs.timecode_blocks || []
          }));
          setSongs(formattedSongs);
        }
      }
    } catch (e) { console.error("Erro ao carregar roteiro", e); }

    try {
      const prefs = localStorage.getItem('canta_player_prefs');
      if (prefs) {
        const p = JSON.parse(prefs);
        if (p.fontFamily) setFontFamily(p.fontFamily);
        if (p.fontSizeIndex !== undefined) setFontSizeIndex(p.fontSizeIndex);
        if (p.highContrast !== undefined) setHighContrast(p.highContrast);
        if (p.autoAdvance !== undefined) setAutoAdvance(p.autoAdvance);
      }
    } catch(e) {}

    setLoading(false);
  };

  const savePreferences = (updates) => {
    try {
      const prefs = localStorage.getItem('canta_player_prefs');
      let p = prefs ? JSON.parse(prefs) : {};
      p = { ...p, ...updates };
      localStorage.setItem('canta_player_prefs', JSON.stringify(p));
    } catch(e) {}
  };

  const currentSong = songs[safeSongIndex] || null;
  const isLastSong = safeSongIndex >= songs.length - 1;

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveBlockIndex(-1);
    setScrolling(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [safeSongIndex]);

  useEffect(() => {
    if (isPlaying && currentSong) {
      startTimeRef.current = performance.now() - (currentTime * 1000);
      
      playIntervalRef.current = setInterval(() => {
        const now = performance.now();
        const elapsedSeconds = (now - startTimeRef.current) / 1000;
        
        const duration = currentSong.duration || 0;
        
        if (duration > 0 && elapsedSeconds >= duration) {
           setCurrentTime(duration);
           setIsPlaying(false);
           
           if (autoAdvance && !isLastSong) {
              setTimeout(() => handleNext(), advanceDelay * 1000);
           }
        } else {
           setCurrentTime(elapsedSeconds);
        }
      }, 50);
    } else {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying, currentTime, currentSong, autoAdvance, isLastSong, advanceDelay]);

  useEffect(() => {
    if (!currentSong || isDraggingRef.current) return;

    if (currentSong.blocks && currentSong.blocks.length > 0) {
      let currentIdx = -1;
      for (let i = 0; i < currentSong.blocks.length; i++) {
        if (currentTime >= currentSong.blocks[i].time) {
          currentIdx = i;
        } else {
          break;
        }
      }
      
      if (currentIdx !== activeBlockIndex) {
        setActiveBlockIndex(currentIdx);
        if (currentIdx >= 0 && containerRef.current && isPlaying) {
          const linesContainer = containerRef.current.querySelector('#lyrics-container');
          if (linesContainer && linesContainer.children[currentIdx]) {
             const activeElement = linesContainer.children[currentIdx];
             containerRef.current.scrollTo({
                top: activeElement.offsetTop - (containerRef.current.clientHeight / 3),
                behavior: 'smooth'
             });
          }
        }
      }
    } else if (isPlaying && currentSong.duration > 0 && containerRef.current) {
      const progress = currentTime / currentSong.duration;
      const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
      containerRef.current.scrollTo({
         top: maxScroll * progress,
         behavior: 'auto' 
      });
    }
  }, [currentTime, activeBlockIndex, currentSong, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' || e.code === 'PageDown') {
        handleNext();
      } else if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, safeSongIndex, songs.length]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    if (!isLastSong) navigate(`/setlists/${id}/play/${safeSongIndex + 1}`, { replace: true });
  };

  const handlePrev = () => {
    if (safeSongIndex > 0) navigate(`/setlists/${id}/play/${safeSongIndex - 1}`, { replace: true });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentDuration = currentSong?.duration || 0;
  const progressPercent = currentDuration > 0 ? (currentTime / currentDuration) * 100 : 0;

  if (loading) return <LoadingScreen message="Preparando o palco..." />;

  if (!songs || songs.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black uppercase mb-4 text-red-500">Repertório Vazio ou Indisponível</h2>
        <p className="text-white/50 mb-8">Nenhuma música encontrada ou você está offline sem o cache completo deste show.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl">Voltar</button>
      </div>
    );
  }

  if (!currentSong) {
     navigate(`/setlists/${id}/play/0`, { replace: true });
     return null;
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-500 ${highContrast ? 'bg-black text-white' : 'bg-[#f4f4f0] text-black'}`}>
      
      {/* Top Header */}
      <div className={`h-16 px-4 flex items-center justify-between z-40 border-b-2 flex-shrink-0 ${highContrast ? 'bg-black/90 border-white/10' : 'bg-[#f4f4f0]/90 border-black/10'} backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <button 
            aria-label="Sair do Modo Palco" 
            onClick={() => navigate(`/setlists/${id}/edit`)} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${highContrast ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="hidden sm:block">
             <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${highContrast ? 'bg-white/10 text-white/50' : 'bg-black/5 text-black/50'}`}>
               FAIXA {safeSongIndex + 1} DE {songs.length}
             </span>
          </div>
        </div>

        <div className="flex-1 text-center px-4 truncate">
          <h1 className="font-black uppercase tracking-tight text-lg truncate">{currentSong.title}</h1>
          {currentSong.artist && <p className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${highContrast ? 'text-white/40' : 'text-black/40'}`}>{currentSong.artist}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button 
            aria-label="Preferências Visuais" 
            onClick={() => setShowSettings(!showSettings)} 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95 ${showSettings ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-black text-white') : (highContrast ? 'hover:bg-white/10' : 'hover:bg-black/5')}`}
          >
            <Monitor size={20} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`h-1.5 w-full relative flex-shrink-0 ${highContrast ? 'bg-white/10' : 'bg-black/5'}`}>
         <div className={`absolute top-0 left-0 h-full transition-all duration-100 ${highContrast ? 'bg-yellow-400' : 'bg-black'}`} style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className={`absolute top-20 right-4 w-72 rounded-3xl p-5 z-50 shadow-2xl border-4 ${highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-black'} animate-fadeIn`}>
          <div className="space-y-6">
            
            {/* Font Size */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highContrast ? 'text-white/40' : 'text-black/40'}`}>Tamanho</p>
              <div className={`flex items-center justify-between p-1 rounded-xl ${highContrast ? 'bg-black' : 'bg-gray-100'}`}>
                <button 
                  aria-label="Diminuir Fonte" 
                  onClick={() => { setFontSizeIndex(Math.max(0, fontSizeIndex - 1)); savePreferences({fontSizeIndex: Math.max(0, fontSizeIndex - 1)}); }} 
                  className={`w-10 h-10 flex items-center justify-center rounded-lg active:scale-95 ${highContrast ? 'hover:bg-white/10 text-white' : 'hover:bg-white text-black'}`}
                >
                  <ZoomOut size={18} />
                </button>
                <span className={`font-black text-xs ${highContrast ? 'text-white' : 'text-black'}`}>{fontSizeIndex + 1}</span>
                <button 
                  aria-label="Aumentar Fonte" 
                  onClick={() => { setFontSizeIndex(Math.min(FONT_SIZES.length - 1, fontSizeIndex + 1)); savePreferences({fontSizeIndex: Math.min(FONT_SIZES.length - 1, fontSizeIndex + 1)}); }} 
                  className={`w-10 h-10 flex items-center justify-center rounded-lg active:scale-95 ${highContrast ? 'hover:bg-white/10 text-white' : 'hover:bg-white text-black'}`}
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${highContrast ? 'text-white/40' : 'text-black/40'}`}>Fonte</p>
              <div className="flex gap-2">
                {Object.keys(FONT_FAMILIES).map(font => (
                  <button 
                    key={font}
                    aria-label={`Mudar para fonte ${font}`}
                    onClick={() => { setFontFamily(font); savePreferences({fontFamily: font}); }}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${fontFamily === font ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-black text-white') : (highContrast ? 'bg-black text-white/50' : 'bg-gray-100 text-black/50')}`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Toggle */}
            <div className="space-y-2">
              <button 
                onClick={() => { setHighContrast(!highContrast); savePreferences({highContrast: !highContrast}); }}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${highContrast ? 'bg-white text-black' : 'bg-black text-white'}`}
              >
                {highContrast ? "Modo Claro" : "Modo Escuro"}
              </button>

              <button 
                onClick={() => { setAutoAdvance(!autoAdvance); savePreferences({autoAdvance: !autoAdvance}); }}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${autoAdvance ? (highContrast ? 'border-yellow-400 text-yellow-400' : 'border-black text-black') : (highContrast ? 'border-zinc-700 text-zinc-500' : 'border-gray-200 text-gray-400')}`}
              >
                Auto-Próxima {autoAdvance ? 'ON' : 'OFF'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Lyrics */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto px-6 lg:px-20 py-12 custom-scrollbar scroll-smooth"
          onTouchStart={() => { isDraggingRef.current = true; setIsPlaying(false); }}
          onTouchEnd={() => { isDraggingRef.current = false; }}
          onMouseDown={() => { isDraggingRef.current = true; setIsPlaying(false); }}
          onMouseUp={() => { isDraggingRef.current = false; }}
        >
          <div className={`max-w-4xl mx-auto pb-[60vh] ${FONT_FAMILIES[fontFamily]}`}>
            {currentSong.blocks && currentSong.blocks.length > 0 ? (
              <div id="lyrics-container" className="space-y-4 sm:space-y-6">
                {currentSong.blocks.map((block, idx) => {
                  const isActive = idx === activeBlockIndex;
                  const isPast = idx < activeBlockIndex;
                  return (
                    <p 
                      key={idx} 
                      className={`transition-all duration-300 font-bold leading-tight ${FONT_SIZES[fontSizeIndex]} 
                        ${isActive ? (highContrast ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'text-black') : 
                          isPast ? (highContrast ? 'text-white/20' : 'text-black/20') : 
                          (highContrast ? 'text-white/60' : 'text-black/60')}
                      `}
                    >
                      {block.text}
                    </p>
                  );
                })}
              </div>
            ) : (
              <pre className={`whitespace-pre-wrap font-bold leading-relaxed ${FONT_SIZES[fontSizeIndex]} ${highContrast ? 'text-white/80' : 'text-black/80'}`}>
                {currentSong.text || "Letra não encontrada."}
              </pre>
            )}
          </div>
        </div>

        {/* Right Side: Setlist List (Desktop only) */}
        <div className={`hidden lg:flex w-80 flex-col border-l-2 flex-shrink-0 ${highContrast ? 'border-white/10 bg-black' : 'border-black/10 bg-[#f4f4f0]'}`}>
          <div className={`p-4 border-b-2 font-black uppercase tracking-widest text-xs ${highContrast ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50'}`}>
            Repertório
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {songs.map((song, idx) => {
              const isCurrent = idx === safeSongIndex;
              return (
                <button
                  key={song.id}
                  onClick={() => navigate(`/setlists/${id}/play/${idx}`)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${isCurrent ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-black text-white') : (highContrast ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/5 text-black/70')}`}
                >
                  <p className="font-black text-sm uppercase tracking-tight truncate">{song.title}</p>
                  {song.artist && <p className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${isCurrent ? (highContrast ? 'text-black/60' : 'text-white/60') : (highContrast ? 'text-white/40' : 'text-black/40')}`}>{song.artist}</p>}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Controls */}
      <div className={`h-24 px-6 flex items-center justify-between z-40 border-t-2 flex-shrink-0 ${highContrast ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'} backdrop-blur-md`}>
        
        <div className="flex-1 flex justify-start">
          <button aria-label="Música Anterior" onClick={handlePrev} disabled={safeSongIndex === 0} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${safeSongIndex === 0 ? 'opacity-20 cursor-not-allowed' : (highContrast ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black')}`}>
            <ChevronLeft size={32} />
          </button>
        </div>

        <div className="flex-1 flex justify-center flex-col items-center">
           <button 
             aria-label={isPlaying ? "Pausar Teleprompter" : "Iniciar Teleprompter"}
             onClick={togglePlay} 
             className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : (highContrast ? 'bg-yellow-400 text-black hover:bg-yellow-300' : 'bg-black text-white hover:bg-gray-800')}`}
           >
             {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
           </button>
           <span className={`text-[10px] font-mono font-black mt-2 tracking-widest ${highContrast ? 'text-white/50' : 'text-black/50'}`}>
             {formatTime(currentTime)} / {formatTime(currentDuration)}
           </span>
        </div>

        <div className="flex-1 flex justify-end">
          <button aria-label="Próxima Música" onClick={handleNext} disabled={isLastSong} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isLastSong ? 'opacity-20 cursor-not-allowed' : (highContrast ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-black')}`}>
            <ChevronRight size={32} />
          </button>
        </div>

      </div>

    </div>
  );
}