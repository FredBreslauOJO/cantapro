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
  
  const [activeBlockIndex, setActiveIndex] = useState(-1);
  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('cantapro_fontSize');
    return savedSize ? parseInt(savedSize, 10) : 24;
  });
  
  const currentIndex = parseInt(songIndex, 10) || 0;
  const contentRef = useRef(null);
  const wakeLockRef = useRef(null);

  const playbackRef = useRef({ playing: false, startTime: 0, elapsed: 0, animationId: null });

  // REFS PARA O PEDAL BLUETOOTH NÃO PEGAR ESTADOS VELHOS
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const songsLengthRef = useRef(songs.length);
  useEffect(() => { songsLengthRef.current = songs.length; }, [songs.length]);

  // CONTROLE DE PEDAL BLUETOOTH (TECLADO)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // PEDAL 1: PLAY/PAUSE (Espaço ou Enter)
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault(); 
        if (isPlayingRef.current) {
          stopAutoScroll();
          setIsPlaying(false);
        } else {
          startAutoScroll();
          setIsPlaying(true);
        }
      } 
      // PEDAL 2: PRÓXIMA MÚSICA (Seta Direita ou Page Down)
      else if (e.code === 'ArrowRight' || e.code === 'PageDown') {
        e.preventDefault();
        if (currentIndexRef.current + 1 < songsLengthRef.current) {
          navigate(`/setlists/${id}/play/${currentIndexRef.current + 1}`);
        }
      } 
      // PEDAL 3: MÚSICA ANTERIOR (Seta Esquerda ou Page Up)
      else if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
        e.preventDefault();
        if (currentIndexRef.current - 1 >= 0) {
          navigate(`/setlists/${id}/play/${currentIndexRef.current - 1}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate]);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) { console.warn(`Wake Lock ignorado`); }
    };
    requestWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLockRef.current) { wakeLockRef.current.release().catch(() => {}); wakeLockRef.current = null; }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAutoScroll();
    };
  }, []);

  useEffect(() => {
    stopAutoScroll();
    playbackRef.current = { playing: false, startTime: 0, elapsed: 0, animationId: null };
    setActiveIndex(-1);
    setIsPlaying(false);
    setIsMenuOpen(false);
    setIsSetlistOpen(false);
    window.scrollTo(0, 0);
  }, [currentIndex]);

  useEffect(() => {
    const loadSetlistAndSongs = async () => {
      setLoading(true);
      try {
        if (!id) return;
        const { data: setlistData } = await supabase.from('setlists').select('event_name').eq('id', id).maybeSingle();
        if (setlistData) setSetlistName(setlistData.event_name);

        const { data: pivotData } = await supabase
          .from('setlist_items')
          .select(`id, item_type, content, performance_notes, order_index, songs ( * )`)
          .eq('setlist_id', id)
          .order('order_index', { ascending: true });

        if (pivotData) {
          const formattedItems = pivotData.map(item => {
            if (item.item_type === 'divider') {
              let dividerText = item.content || 'PAUSA';
              if (item.performance_notes) dividerText += `\n\n${item.performance_notes}`;
              return { id: item.id, title: item.content || 'DIVISOR', isSeparator: true, lyrics_text: dividerText };
            } 
            else if (item.item_type === 'song' && item.songs) return item.songs;
            return null;
          }).filter(Boolean);
          
          setSongs(formattedItems);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    loadSetlistAndSongs();
  }, [id]);

  const togglePlay = () => {
    if (isPlaying) { stopAutoScroll(); setIsPlaying(false); } 
    else { startAutoScroll(); setIsPlaying(true); }
  };

  const getParsedTimecodes = (song) => {
    if (!song) return [];
    const raw = song.timecodes || song.blocks || song.timecode_blocks || song.sync_data;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch(e) { return []; }
    }
    return Array.isArray(raw) ? raw : [];
  };

  // =========================================================================
  // FUNÇÃO CORRIGIDA: AGORA LÊ "text_content" E IGNORA IDs MINÚSCULOS
  // =========================================================================
  const extractBlockText = (block) => {
    if (!block) return "[ BLOCO VAZIO ]";
    if (typeof block === 'string') return block.toUpperCase().startsWith('BLOCK_') ? "[ BLOCO SEM TEXTO ]" : block;
    
    // Adicionado 'text_content' no topo da prioridade!
    const commonKeys = ['text_content', 'text', 'content', 'lyrics', 'line', 'words', 'lyric', 'phrase', 'value'];
    
    for (let key of commonKeys) {
      if (block[key] && typeof block[key] === 'string' && !block[key].toUpperCase().startsWith('BLOCK_')) {
        return block[key];
      }
    }
    
    // Fallback de varredura profunda (ignora chaves que contêm "id")
    let bestString = "";
    const searchDeep = (obj) => {
      if (!obj) return;
      Object.entries(obj).forEach(([k, v]) => {
        if (typeof v === 'string') {
          if (v.trim() !== '' && !v.toUpperCase().startsWith('BLOCK_') && !k.toLowerCase().includes('id') && k !== 'type') {
            if (v.length > bestString.length) bestString = v;
          }
        } else if (typeof v === 'object') searchDeep(v);
      });
    };
    searchDeep(block);
    return bestString || "[ BLOCO SEM TEXTO ]";
  };

  const startAutoScroll = () => {
    const currentSong = songs[currentIndex];
    if (!currentSong) return;

    const timecodes = getParsedTimecodes(currentSong);
    const hasTimecodes = timecodes.length > 0;

    playbackRef.current.playing = true;
    playbackRef.current.startTime = Date.now() - playbackRef.current.elapsed;

    const loop = () => {
      if (!playbackRef.current.playing) return;
      
      const now = Date.now();
      const elapsed = now - playbackRef.current.startTime;
      playbackRef.current.elapsed = elapsed;

      if (hasTimecodes) {
        const currentBlockIdx = timecodes.findIndex(tc => {
          const startMs = (tc.start_time ?? tc.startTime ?? tc.start ?? tc.time ?? tc.timecode ?? 0) * 1000;
          const endMs = (tc.end_time ?? tc.endTime ?? tc.end ?? (startMs / 1000) + 5) * 1000;
          return elapsed >= startMs && elapsed <= endMs;
        });

        setActiveIndex(prev => prev !== currentBlockIdx ? currentBlockIdx : prev);

        if (currentBlockIdx !== -1) {
          const blockElement = document.getElementById(`block-${currentBlockIdx}`);
          if (blockElement) {
            const tc = timecodes[currentBlockIdx];
            const startMs = (tc.start_time ?? tc.startTime ?? tc.start ?? tc.time ?? tc.timecode ?? 0) * 1000;
            const endMs = (tc.end_time ?? tc.endTime ?? tc.end ?? (startMs / 1000) + 5) * 1000;
            
            const duration = endMs - startMs;
            const progress = duration > 0 ? (elapsed - startMs) / duration : 0;
            
            const blockTop = blockElement.offsetTop;
            const blockHeight = blockElement.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            const alignTop = blockTop - (viewportHeight / 2);
            const alignBottom = (blockTop + blockHeight) - (viewportHeight / 2);
            
            const targetY = alignTop + ((alignBottom - alignTop) * progress);
            window.scrollTo(0, targetY);
          }
        }

        const lastBlock = timecodes[timecodes.length - 1];
        const maxTimeMs = (lastBlock.end_time ?? lastBlock.endTime ?? lastBlock.end ?? lastBlock.timecode ?? 0) * 1000;
        
        if (elapsed < maxTimeMs) playbackRef.current.animationId = requestAnimationFrame(loop);
        else { stopAutoScroll(); setIsPlaying(false); }

      } else {
        const durationSec = currentSong.duration_seconds || 0;
        const durationMs = durationSec > 0 ? durationSec * 1000 : 30000; 
        
        const startScrollY = 0;
        const totalHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        const distanceToScroll = totalHeight - viewportHeight;

        if (distanceToScroll > 0) {
          let progressPercent = elapsed / durationMs;
          if (progressPercent > 1) progressPercent = 1;
          const targetScrollPos = startScrollY + (distanceToScroll * progressPercent);
          window.scrollTo(0, targetScrollPos);
        }

        if (elapsed < durationMs && (Math.ceil(window.innerHeight + window.scrollY) < document.documentElement.scrollHeight)) {
          playbackRef.current.animationId = requestAnimationFrame(loop);
        } else {
          stopAutoScroll();
          setIsPlaying(false);
        }
      }
    };
    playbackRef.current.animationId = requestAnimationFrame(loop);
  };

  const stopAutoScroll = () => {
    playbackRef.current.playing = false;
    if (playbackRef.current.animationId) cancelAnimationFrame(playbackRef.current.animationId);
  };

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < songs.length) {
      navigate(`/setlists/${id}/play/${newIndex}`);
    }
  };

  const changeFontSize = (delta) => {
    setFontSize(prev => {
      const newSize = Math.max(16, Math.min(100, prev + delta));
      localStorage.setItem('cantapro_fontSize', newSize);
      return newSize;
    });
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (songs.length === 0) return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center"><p className="mb-6 font-bold text-white/50 uppercase tracking-widest text-sm">Nenhum conteúdo carregado.</p><button onClick={() => navigate('/setlists')} className="px-6 py-3 bg-white text-black font-black uppercase rounded-xl">Voltar</button></div>;

  const currentSong = songs[currentIndex];
  const prevSong = songs[currentIndex - 1];
  const nextSong = songs[currentIndex + 1];
  
  const timecodes = getParsedTimecodes(currentSong);
  const hasTimecodes = timecodes.length > 0;
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
        
        <div className="flex gap-2 pointer-events-auto shrink-0">
          <button onClick={() => setIsSetlistOpen(true)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center border border-transparent hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <ListMusic size={18} className="ml-0.5" />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white">
            <Settings size={18} />
          </button>
          <button onClick={() => navigate('/setlists')} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* OVERLAY SETLIST */}
      {isSetlistOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fadeIn">
          <div className="pt-8 pb-4 px-6 flex justify-between items-center border-b border-white/10 bg-black z-10 shadow-xl">
            <div className="w-3/4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-white leading-none">Repertório</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 truncate">{setlistName}</p>
            </div>
            <button onClick={() => setIsSetlistOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 text-white shrink-0">
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
                      : 'bg-[#111] text-white border border-white/5'
                }`}
              >
                <span className={`text-xl sm:text-2xl font-black tracking-tighter shrink-0 ${idx === currentIndex ? 'text-black/30' : song.isSeparator ? 'text-yellow-500/50' : 'text-white/20'}`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-xl sm:text-3xl font-black uppercase tracking-tight truncate">{song.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAY CONFIGURAÇÕES */}
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
                <button onClick={() => changeFontSize(-4)} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl active:scale-95">-</button>
                <div className="flex-1 text-center font-black text-xl">{fontSize}px</div>
                <button onClick={() => changeFontSize(4)} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl active:scale-95">+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DA LETRA */}
      <div ref={contentRef} className="pt-40 pb-40 px-6 max-w-4xl mx-auto w-full min-h-screen flex flex-col justify-center">
        {hasTimecodes ? (
          <div className="w-full flex flex-col gap-12 pb-[50vh]">
            {timecodes.map((tc, idx) => {
              const isActive = activeBlockIndex === idx;
              const textContent = extractBlockText(tc);
              
              return (
                <div 
                  key={tc.id || idx} 
                  id={`block-${idx}`} 
                  className={`w-full transition-all duration-300 origin-left ${isActive ? 'text-white scale-105 opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'text-white/40 scale-100'}`}
                >
                  <pre 
                    className="whitespace-pre-wrap break-words font-black uppercase leading-relaxed tracking-tight text-left"
                    style={{ fontSize: `${fontSize}px`, wordBreak: 'break-word', overflowWrap: 'anywhere', fontFamily: 'inherit' }}
                  >
                    {textContent}
                  </pre>
                </div>
              );
            })}
          </div>
        ) : (
          <pre 
            className={`whitespace-pre-wrap break-words font-black uppercase leading-relaxed tracking-tight w-full flex flex-col justify-center ${currentSong.isSeparator ? 'text-yellow-400 text-center items-center min-h-[40vh]' : 'text-white/90 text-left items-start'}`}
            style={{ fontSize: `${fontSize}px`, wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {songText || (currentSong.isSeparator ? "" : "NENHUMA LETRA CADASTRADA PARA ESTA MÚSICA.")}
          </pre>
        )}
      </div>

      {/* CONTROLES DE RODAPÉ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 p-3 pb-6 sm:pb-3 flex items-center justify-between gap-3 z-30">
        <div className="flex-1 w-1/3">
          {prevSong ? (
            <button onClick={() => handleNavigate(currentIndex - 1)} className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase border border-white/5">
              <ChevronLeft size={18} className="shrink-0" /> <span className="truncate">{prevSong.title?.substring(0, 6)}..</span>
            </button>
          ) : (
            <button onClick={() => navigate('/setlists')} className="w-full h-14 text-white/20 hover:text-white/50 flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
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
              <span className="truncate">{nextSong.title?.substring(0, 6)}..</span> <ChevronRight size={18} className="shrink-0" />
            </button>
          ) : (
            <button onClick={() => navigate('/setlists')} className="w-full h-14 text-white/20 hover:text-white/50 flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
              FIM <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}