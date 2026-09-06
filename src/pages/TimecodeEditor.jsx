import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../lib/AuthContext';

export default function TimecodeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOnline } = useAuth();
  
  const [song, setSong] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeBlockIndex, setActiveBlockIndex] = useState(-1);
  const [newBlockText, setNewBlockText] = useState("");

  const containerRef = useRef(null);
  const playIntervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    loadSong();
  }, [id]);

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = performance.now() - (currentTime * 1000);
      lastUpdateRef.current = performance.now();
      
      playIntervalRef.current = setInterval(() => {
        const now = performance.now();
        const elapsedSeconds = (now - startTimeRef.current) / 1000;
        setCurrentTime(elapsedSeconds);
      }, 50);
    } else {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying, currentTime]);

  useEffect(() => {
    let currentIdx = -1;
    for (let i = 0; i < blocks.length; i++) {
      if (currentTime >= blocks[i].time) {
        currentIdx = i;
      } else {
        break;
      }
    }
    
    if (currentIdx !== activeBlockIndex) {
      setActiveBlockIndex(currentIdx);
      if (currentIdx >= 0 && containerRef.current) {
        const activeElement = containerRef.current.children[currentIdx];
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, blocks, activeBlockIndex]);

  const loadSong = async () => {
    try {
      const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
      if (data && !error) {
        setSong(data);
        if (data.timecode_blocks && Array.isArray(data.timecode_blocks)) {
          setBlocks(data.timecode_blocks);
        } else {
          // Fallback se não existir
          const lines = (data.lyrics_text || "").split('\n').filter(l => l.trim() !== "");
          const initialBlocks = lines.map((text, idx) => ({
            time: idx * 5, 
            endTime: (idx * 5) + 4,
            text: text.trim()
          }));
          setBlocks(initialBlocks);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const markTime = () => {
    if (!newBlockText.trim()) return;
    
    const newBlock = {
      time: parseFloat(currentTime.toFixed(2)),
      endTime: parseFloat((currentTime + 5).toFixed(2)),
      text: newBlockText.trim()
    };

    setBlocks(prev => {
      const updated = [...prev, newBlock].sort((a, b) => a.time - b.time);
      updated.forEach((b, idx) => {
        if (idx < updated.length - 1) b.endTime = updated[idx + 1].time;
      });
      return updated;
    });
    
    setNewBlockText("");
  };

  const removeBlock = (indexToRemove) => {
    setBlocks(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      updated.forEach((b, idx) => {
        if (idx < updated.length - 1) b.endTime = updated[idx + 1].time;
        else b.endTime = b.time + 10;
      });
      return updated;
    });
  };

  const updateBlockTime = (index, newTimeStr) => {
    const newTime = parseFloat(newTimeStr);
    if (isNaN(newTime)) return;
    
    setBlocks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], time: newTime };
      updated.sort((a, b) => a.time - b.time);
      updated.forEach((b, idx) => {
        if (idx < updated.length - 1) b.endTime = updated[idx + 1].time;
        else b.endTime = b.time + 10;
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!isOnline) {
      alert("Você precisa estar conectado à internet para salvar os timecodes.");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('songs').update({ timecode_blocks: blocks }).eq('id', song.id);
      
      // Auditoria: O Throw garante que se a rede cair ou o servidor rejeitar, 
      // o catch vai interceptar e não deixará o usuário voltar para a tela inicial perdendo o trabalho.
      if (error) throw error; 
      
      navigate('/songs');
    } catch (err) {
      alert("Erro ao salvar sincronização: " + err.message + "\n\nSeu progresso foi mantido na tela.");
      setSaving(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingScreen message="Carregando sincronizador..." />;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      
      <div className="bg-zinc-900 border-b-2 border-zinc-800 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button aria-label="Voltar sem salvar" onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-black uppercase tracking-tight text-lg leading-tight">{song?.title}</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{song?.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            aria-label="Reiniciar o tempo para zero"
            onClick={() => { setIsPlaying(false); setCurrentTime(0); }} 
            className="w-10 h-10 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw size={18} />
          </button>
          
          <button 
            aria-label={saving ? "Salvando..." : "Salvar Timecodes"}
            onClick={handleSave} 
            disabled={saving || !isOnline}
            className={`px-4 h-10 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors ${!isOnline ? 'bg-zinc-800 text-zinc-500' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
          >
            {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">{saving ? "Salvando..." : "Salvar"}</span>
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 p-4 border-b border-zinc-900 flex flex-col items-center z-20">
        <div className="text-4xl font-mono font-black tracking-tight text-yellow-400 mb-4 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex w-full max-w-2xl gap-2">
          <button 
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            onClick={togglePlay} 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white hover:bg-gray-200 text-black'}`}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <input 
            type="text" 
            aria-label="Digitar nova linha de letra"
            value={newBlockText} 
            onChange={e => setNewBlockText(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter') markTime(); }}
            placeholder="Digite o próximo verso e aperte Enter..."
            className="flex-1 bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-4 font-bold outline-none focus:border-yellow-400 focus:bg-zinc-800 transition-colors"
          />

          <button 
            aria-label="Registrar linha no tempo atual"
            onClick={markTime}
            disabled={!newBlockText.trim()}
            className="w-14 h-14 bg-zinc-800 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus size={24} />
          </button>
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-3">Dica: Use a tecla Enter para registrar o tempo rapidamente.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black" ref={containerRef}>
        <div className="max-w-2xl mx-auto space-y-2 pb-[50vh]">
          {blocks.length === 0 ? (
            <div className="text-center py-20 text-zinc-600">
              <p className="font-black uppercase tracking-widest text-sm">Nenhum Timecode</p>
              <p className="text-xs font-bold mt-2">Dê o play e adicione as frases no ritmo da música.</p>
            </div>
          ) : (
            blocks.map((block, index) => {
              const isActive = index === activeBlockIndex;
              return (
                <div 
                  key={index} 
                  className={`p-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${isActive ? 'bg-yellow-400 text-black scale-[1.02] shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                >
                  <input 
                    type="number" 
                    step="0.01" 
                    value={block.time} 
                    onChange={e => updateBlockTime(index, e.target.value)}
                    aria-label={`Editar tempo da linha ${index + 1}`}
                    className={`w-20 font-mono font-black text-xs p-1 rounded outline-none text-center bg-transparent ${isActive ? 'text-black border-black/20 focus:border-black/50' : 'text-zinc-500 border-zinc-700 focus:border-zinc-500 focus:text-white'} border`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isActive ? 'text-black text-lg' : 'text-white'}`}>{block.text}</p>
                  </div>
                  <button 
                    aria-label={`Excluir linha ${index + 1}`}
                    onClick={() => removeBlock(index)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'text-black/40 hover:text-black hover:bg-black/10' : 'text-zinc-600 hover:text-red-400 hover:bg-red-400/10'}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}