import React, { useState } from 'react';
import { Search, Download, AlertTriangle, Loader2 } from 'lucide-react';

export default function OnlineLyricsSearch({ userPlan, onSaveLyrics, onUpgradeClick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchLyrics = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        // AUDITORIA FIX: Tratamento elegante do Erro 503 (Servidor fora do ar)
        if (res.status >= 500) {
          throw new Error("O servidor mundial de letras está temporariamente fora do ar. Por favor, tente novamente em alguns minutos.");
        }
        throw new Error("Não foi possível buscar as letras no momento.");
      }

      const data = await res.json();
      if (data.length === 0) {
        setError("Nenhuma letra encontrada. Tente buscar pelo refrão ou digite manualmente.");
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err.message || "Falha na conexão com o servidor de letras.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (track) => {
    const isSynced = !!track.syncedLyrics;
    let blocks = null;
    let rawText = track.syncedLyrics || track.plainLyrics || "";

    // AUDITORIA FIX: Só extrai timecodes se eles de fato existirem na string, 
    // prevenindo o bug de letras simples ganharem timecodes zerados (0:00).
    if (isSynced && track.syncedLyrics) {
      blocks = [];
      const lines = track.syncedLyrics.split('\n');
      lines.forEach(line => {
        const match = line.match(/^\[(\d{2}):(\d{2}\.\d{2})\](.*)/);
        if (match) {
          const min = parseInt(match[1]);
          const sec = parseFloat(match[2]);
          const text = match[3].trim();
          const totalSeconds = (min * 60) + sec;
          
          if (text) {
            blocks.push({
              time: totalSeconds,
              text: text
            });
          }
        }
      });

      blocks.forEach((block, idx) => {
        if (idx < blocks.length - 1) {
          block.endTime = blocks[idx + 1].time;
        } else {
          block.endTime = block.time + 10; 
        }
      });
      
      // Limpeza de segurança final
      blocks = blocks.filter(b => b.endTime > b.time && b.time >= 0);
      if (blocks.length === 0) blocks = null; 
    }

    onSaveLyrics({
      title: track.name || track.trackName,
      artist: track.artistName,
      duration: track.duration || 0,
      raw_text: rawText,
      blocks: blocks
    });
  };

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <form onSubmit={searchLyrics} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nome da música e artista..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold outline-none focus:bg-white transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="px-6 bg-black text-white font-black uppercase text-xs rounded-xl disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Buscar"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-500 rounded-xl flex items-start gap-3 text-red-700">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {results.map((track) => (
            <div key={track.id} className="p-3 border-2 border-gray-200 rounded-xl hover:border-black transition-colors flex items-center justify-between group">
              <div className="min-w-0 flex-1 pr-4">
                <p className="font-black text-sm uppercase truncate text-black">{track.name || track.trackName}</p>
                <p className="text-xs font-bold text-gray-500 uppercase truncate mt-0.5">{track.artistName}</p>
                <div className="flex gap-2 mt-1.5">
                  {track.syncedLyrics ? (
                     <span className="text-[9px] font-black px-2 py-0.5 bg-green-100 text-green-700 rounded-md border border-green-200 uppercase tracking-widest">Sincronizada</span>
                  ) : (
                     <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200 uppercase tracking-widest">Texto Simples</span>
                  )}
                  {track.duration > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md border border-gray-200 uppercase tracking-widest">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleImport(track)}
                aria-label="Importar Letra"
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-black group-hover:bg-yellow-400 group-hover:border-2 group-hover:border-black transition-all active:scale-95 flex-shrink-0"
              >
                <Download size={18} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}