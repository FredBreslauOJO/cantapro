import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PlaySong() {
  const { id, songIndex } = useParams();
  const navigate = useNavigate();
  
  const [songs, setSongs] = useState([]);
  const [setlistName, setSetlistName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentIndex = parseInt(songIndex, 10) || 0;
  const contentRef = useRef(null);
  const scrollIntervalRef = useRef(null);

  useEffect(() => {
    loadSetlistAndSongs();
    return () => stopAutoScroll(); // Limpa o scroll ao sair
  }, [id]);

  // Sempre que mudar de música, para o scroll e volta pro topo
  useEffect(() => {
    stopAutoScroll();
    setIsPlaying(false);
    window.scrollTo(0, 0);
  }, [currentIndex]);

  const loadSetlistAndSongs = async () => {
    setLoading(true);
    try {
      // 1. Busca os dados do Setlist
      const { data: setlistData } = await supabase
        .from('setlists')
        .select('event_name')
        .eq('id', id)
        .single();
        
      if (setlistData) setSetlistName(setlistData.event_name);

      // 2. Busca as músicas usando a tabela relacional CORRETA ( setlist_items)
      const { data: pivotData, error } = await supabase
        .from('setlist_items')
        .select(`
          position,
          songs ( id, title, artist, lyrics, timecode )
        `)
        .eq('setlist_id', id)
        .order('position', { ascending: true });

      if (error) throw error;

      if (pivotData) {
        // Mapeia as músicas e filtra casos de músicas deletadas
        const formattedSongs = pivotData.map(item => item.songs).filter(Boolean);
        setSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Erro ao carregar o modo performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
    setIsPlaying(!isPlaying);
  };

  const startAutoScroll = () => {
    // Lógica básica de Autoscroll (pode ser ajustada para usar o timecode)
    scrollIntervalRef.current = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'auto' });
    }, 50); // Velocidade do scroll (quanto menor o número, mais rápido)
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  };

  const handleNavigate = (newIndex) => {
    if (newIndex >= 0 && newIndex < songs.length) {
      navigate(`/setlists/${id}/play/${newIndex}`);
    }
  };

  // Função utilitária para formatar o nome no botão (Máx 6 letras + ..)
  const formatNavName = (name) => {
    if (!name) return "";
    const cleaned = name.trim().toUpperCase();
    if (cleaned.length <= 6) return cleaned;
    return cleaned.substring(0, 6) + "..";
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
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="font-black tracking-widest uppercase mb-4 text-white/50">Este setlist está vazio.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl">Voltar</button>
      </div>
    );
  }

  const currentSong = songs[currentIndex];
  const prevSong = songs[currentIndex - 1];
  const nextSong = songs[currentIndex + 1];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Cabeçalho Fixo - Minimalista e Escuro */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black via-black/90 to-transparent pt-6 pb-12 px-6 z-40 flex items-start justify-between pointer-events-none">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-lg leading-none">
            {currentSong?.title}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mt-1 drop-shadow-md">
            {setlistName} • {currentIndex + 1}/{songs.length}
          </p>
        </div>
        <button 
          onClick={() => navigate(`/setlists/${id}/edit`)}
          className="w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white/60 hover:text-white transition-colors pointer-events-auto"
        >
          <X size={20} />
        </button>
      </div>

      {/* Área da Letra (Teleprompter) */}
      <div 
        ref={contentRef}
        className="pt-40 pb-40 px-6 max-w-3xl mx-auto"
      >
        <pre className="whitespace-pre-wrap font-black text-2xl sm:text-4xl lg:text-5xl uppercase leading-relaxed tracking-tight text-white/90 font-sans">
          {currentSong?.lyrics || "NENHUMA LETRA CADASTRADA PARA ESTA MÚSICA."}
        </pre>
      </div>

      {/* Rodapé de Controles - Fixo e Preto com Nomes Curtos */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 p-3 pb-6 sm:pb-3 flex items-center justify-between gap-3 z-50">
        
        {/* Botão Anterior */}
        <div className="flex-1">
          {prevSong ? (
            <button 
              onClick={() => handleNavigate(currentIndex - 1)}
              className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase transition-all active:scale-95 border border-white/5"
            >
              <ChevronLeft size={18} />
              <span className="truncate">{formatNavName(prevSong.title)}</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/setlists/${id}/edit`)}
              className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase transition-colors"
            >
              <X size={16} /> SAIR
            </button>
          )}
        </div>

        {/* Botão Central (Play/Pause) */}
        <button 
          onClick={togglePlay}
          className="w-24 h-14 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 flex-shrink-0"
        >
          {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
        </button>

        {/* Botão Próximo */}
        <div className="flex-1">
          {nextSong ? (
            <button 
              onClick={() => handleNavigate(currentIndex + 1)}
              className="w-full h-14 bg-[#1a1a1a] text-white/50 hover:text-white hover:bg-[#2a2a2a] rounded-xl flex items-center justify-center gap-1 sm:gap-2 font-black text-sm sm:text-base tracking-widest uppercase transition-all active:scale-95 border border-white/5"
            >
              <span className="truncate">{formatNavName(nextSong.title)}</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/setlists/${id}/edit`)}
              className="w-full h-14 bg-transparent text-white/20 hover:text-white/50 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest uppercase transition-colors"
            >
              FIM <X size={16} />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}