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
  const [fontSize, setFontSize] = useState(48); // Tamanho da fonte padrão em px
  
  const currentIndex = parseInt(songIndex, 10) || 0;
  const contentRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  useEffect(() => {
    loadSetlistAndSongs();
    return () => stopAutoScroll();
  }, [id]);

  useEffect(() => {
    stopAutoScroll();
    setIsPlaying(false);
    setIsMenuOpen(false); // Fecha o menu ao mudar de música
    window.scrollTo(0, 0);
  }, [currentIndex]);

  const loadSetlistAndSongs = async () => {
    setLoading(true);
    try {
      const { data: setlistData } = await supabase.from('setlists').select('event_name').eq('id', id).single();
      if (setlistData) setSetlistName(setlistData.event_name);

      const { data: pivotData, error } = await supabase.from('setlist_items').select(`songs ( * )`).eq('setlist_id', id);
      if (error) throw error;

      if (pivotData) {
        const formattedSongs = pivotData.map(item => item.songs).filter(Boolean);
        setSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

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
    if (newIndex >= 0 && newIndex < songs.length) navigate(`/setlists/${id}/play/${newIndex}`);
  };

  const formatNavName = (name) => {
    if (!name) return "";
    const cleaned = name.trim().toUpperCase();
    return cleaned.length <= 6 ? cleaned : cleaned.substring(0, 6) + "..";
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /></div>;
  if (songs.length === 0) return <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center"><button onClick={() => navigate(-1)} className="px-6 py-3 bg-white text-black font-black uppercase rounded-xl">Voltar</button></div>;

  // VARIÁVEIS RESTAURADAS AQUI!
  const currentSong = songs[currentIndex];
  const prevSong = songs[currentIndex - 1];
  const nextSong = songs[currentIndex + 1];
  const songText = currentSong?.lyrics_text || currentSong?.lyrics || currentSong?.content || currentSong?.text || currentSong?.body;
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      
      {/* Cabeçalho */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black via-black/90 to-transparent pt-6 pb-12 px-6 z-40 flex items-start justify-between pointer-events-none">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight drop-shadow-lg leading-none">{currentSong?.title}</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1">{setlistName} • {currentIndex + 1}/{songs.length}</p>
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
          <button onClick={() => navigate(`/setlists/${id}/edit`)} className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Menu Lateral de Configurações */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-end animate-fadeIn">
          <div className="w-80 bg-neutral-900 h-full border-l border-white/10 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black uppercase tracking-widest text-sm">Opções de Palco</h3>
              <button onClick={() => setIsMenuOpen(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
            </div>
            
            {/* Controle de Fonte */}
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2"><Type size={14}/> Tamanho da Letra</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(prev => Math.max(20, prev - 4))} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl hover:bg-neutral-700 active:scale-95">-</button>
                <div className="flex-1 text-center font-black text-xl">{fontSize}px</div>
                <button onClick={() => setFontSize(prev => Math.min(100, prev + 4))} className="w-12 h-12 bg-neutral-800 rounded-xl font-black text-xl hover:bg-neutral-700 active:scale-95">+</button>
              </div>
            </div>

            {/* Índice do Setlist */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2"><ListMusic size={14}/> Repertório</p>
              <div className="space-y-2">
                {songs.map((song, idx) => (
                  <button 
                    key={song.id}
                    onClick={() => handleNavigate(idx)}
                    className={`w-full text-left p-3 rounded-xl text-sm font-black uppercase tracking-wider transition-colors ${idx === currentIndex ? 'bg-white text-black' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
                  >
                    {idx + 1}. {song.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área da Letra */}
      <div ref={contentRef} className="pt-40 pb-40 px-6 max-w-4xl mx-auto">
        <pre 
          className="whitespace-pre-wrap font-black uppercase leading-relaxed tracking-tight text-white/90"
          style={{ fontSize: `${fontSize}px` }}
        >
          {songText || "NENHUMA LETRA CADASTRADA PARA ESTA MÚSICA."}
        </pre>
      </div>

      {/* Controles de Play/Navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 p-3 pb-6 sm:pb-3 flex items-center justify-between gap-3 z-40">
        <div className="flex-1">
          {prevSong ? (
            <button onClick={() => handleNavigate(currentIndex - 1)} className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase border border-white/5">
              <ChevronLeft size={18} /> <span className="truncate">{formatNavName(prevSong.title)}</span>
            </button>
          ) : (
            <button onClick={() => navigate(`/setlists/${id}/edit`)} className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
              <X size={16} /> SAIR
            </button>
          )}
        </div>
        <button onClick={togglePlay} className="w-24 h-14 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 flex-shrink-0">
          {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
        </button>
        <div className="flex-1">
          {nextSong ? (
            <button onClick={() => handleNavigate(currentIndex + 1)} className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase border border-white/5">
              <span className="truncate">{formatNavName(nextSong.title)}</span> <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={() => navigate(`/setlists/${id}/edit`)} className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase">
              FIM <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}