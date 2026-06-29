import React, { useState } from 'react';
import { Search, Eye, X, Check, Sparkles } from 'lucide-react';

export default function OnlineLyricsSearch({ userPlan, onSaveLyrics }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado crucial de feedback visual para o usuário
  const [isSaving, setIsSaving] = useState(false); 
  
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('synced');

  const isPremium = userPlan === 'base' || userPlan === 'pro';

  if (!isPremium) {
    return (
      <div className="p-6 border-4 border-black bg-yellow-50 rounded-3xl text-center max-w-md mx-auto my-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-sans">
        <div className="w-12 h-12 bg-yellow-400 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Sparkles size={22} className="text-black" />
        </div>
        <h3 className="font-black text-lg uppercase tracking-tight mb-2">Buscar letras na Web</h3>
        <p className="text-xs font-bold text-black/70 mb-6 leading-relaxed">
          A busca automatizada de repertório e importação com timecodes é exclusiva para assinantes dos planos **BASE** e **PRO**.
        </p>
        <button className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl">
          Fazer Upgrade Agora
        </button>
      </div>
    );
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Erro ao buscar letras:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // PARSER COM EMBARGO DE REQUISIÇÃO (BLOQUEIA CLIQUE DUPLO)
  const processAndSave = async (track, forcePlain = false) => {
    if (isSaving) return; // Se já estiver salvando, ignora qualquer clique extra
    setIsSaving(true);    // Ativa imediatamente o carregamento visual

    const useSynced = track.syncedLyrics && activePreviewTab === 'synced' && !forcePlain;
    const rawText = useSynced ? track.syncedLyrics : track.plainLyrics;
    
    let generatedBlocks = [];

    if (useSynced) {
      const lines = rawText.split('\n');
      const parsedLines = [];

      lines.forEach((line) => {
        const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const fraction = parseInt(match[3].padEnd(3, '0'), 10) / 1000; 
          const timeInSeconds = (minutes * 60) + seconds + fraction;
          const text = match[4].trim();
          
          parsedLines.push({
            time: Number(timeInSeconds.toFixed(2)),
            text: text
          });
        }
      });

      for (let i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i].text !== "") {
          const start = parsedLines[i].time;
          let end = start + 5; 
          if (i + 1 < parsedLines.length) {
            end = parsedLines[i + 1].time;
          }

          generatedBlocks.push({
            block_id: `block_${Date.now()}_${i}`,
            text_content: parsedLines[i].text,
            start_time: start,
            end_time: end,
            order_index: generatedBlocks.length
          });
        }
      }
    } else {
      const lines = rawText.split('\n');
      lines.forEach((line) => {
        if (line.trim()) {
          generatedBlocks.push({
            block_id: `block_${Date.now()}_${generatedBlocks.length}`,
            text_content: line.trim(),
            start_time: 0,
            end_time: 0,
            order_index: generatedBlocks.length
          });
        }
      });
    }

    try {
      // Espera a resposta real do banco (async/await) antes de fechar o modal
      await onSaveLyrics({
        title: track.trackName.toUpperCase(),
        artist: track.artistName.toUpperCase(),
        duration: track.duration,
        blocks: generatedBlocks,
        raw_text: track.plainLyrics 
      });
      setSelectedTrack(null);
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    } finally {
      setIsSaving(false); // Libera o estado apenas após a conclusão
    }
  };

  return (
    <div className="w-full bg-white text-black font-sans p-4 max-w-xl mx-auto">
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar música ou artista online..."
              className="w-full pl-10 pr-4 py-3 border-4 border-black outline-none rounded-xl text-sm font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
          <button 
            type="submit"
            className="px-5 bg-black text-white rounded-xl border-4 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(234,179,8,1)]"
          >
            Buscar
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-8 font-bold text-sm tracking-wide animate-pulse">
          🔍 Vasculhando banco de dados mundial...
        </div>
      )}

      {/* LISTA DE RESULTADOS */}
      <div className="space-y-3">
        {results.map((track) => (
          <div 
            key={track.id}
            className="p-4 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-between hover:border-black transition-colors"
          >
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-tight text-black">{track.trackName}</h4>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-black text-black/60">
                  {formatDuration(track.duration)}
                </span>
                {track.syncedLyrics ? (
                  <span className="px-1.5 py-0.5 bg-green-100 border border-green-400 text-green-700 rounded text-[10px] font-black uppercase tracking-wide">
                    Synced
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-gray-800 text-white rounded text-[10px] font-black uppercase tracking-wide">
                    Plain
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-black/50 mt-1">
                {track.trackName} - {track.artistName}
              </p>
            </div>

            <button 
              onClick={() => {
                setSelectedTrack(track);
                setActivePreviewTab(track.syncedLyrics ? 'synced' : 'plain');
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DE PREVIEW */}
      {selectedTrack && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            
            <div className="p-4 border-b-2 border-gray-200 flex items-center justify-between">
              <h3 className="font-black text-base uppercase text-black">Preview</h3>
              <button onClick={() => !isSaving && setSelectedTrack(null)} disabled={isSaving} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pt-3 flex gap-2 bg-gray-50 border-b border-gray-200">
              {selectedTrack.syncedLyrics && (
                <button
                  onClick={() => !isSaving && setActivePreviewTab('synced')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-t-2 border-x-2 ${activePreviewTab === 'synced' ? 'bg-white border-black text-black' : 'bg-transparent border-transparent text-black/40'}`}
                >
                  Synced Lyrics
                </button>
              )}
              <button
                onClick={() => !isSaving && setActivePreviewTab('plain')}
                className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-t-2 border-x-2 ${activePreviewTab === 'plain' || !selectedTrack.syncedLyrics ? 'bg-white border-black text-black' : 'bg-transparent border-transparent text-black/40'}`}
              >
                Plain Lyrics
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 font-mono text-xs text-black/80 space-y-1 relative">
              <pre className="whitespace-pre-wrap font-sans font-bold leading-relaxed">
                {activePreviewTab === 'synced' ? selectedTrack.syncedLyrics : selectedTrack.plainLyrics}
              </pre>
            </div>

            {/* BOTÕES DE CONFIRMAÇÃO COM CONTROLE DE CARREGAMENTO */}
            <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">
                Letras fornecidas por LRCLIB
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedTrack(null)}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-200 text-black text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black disabled:opacity-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => processAndSave(selectedTrack)}
                  disabled={isSaving} // Desativa o botão fisicamente ao ser clicado!
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(34,197,94,1)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Importando para o App..." : "Salvar no App"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}