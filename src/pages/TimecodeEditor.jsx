import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Play, Square } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function TimecodeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [overlapError, setOverlapError] = useState(null);
  const previewRef = useRef(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewTimer = useRef(null);

  useEffect(() => {
    loadSong();
  }, [id]);

  const loadSong = async () => {
    const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
    if (data && !error) {
      setSong(data);
      setBlocks(data.timecode_blocks || []);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = Math.floor((secs || 0) % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleTextSelect = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text) setSelectedText(text);
  };

  const createBlockFromSelection = () => {
    if (!selectedText) return;
    setBlocks(prev => [...prev, {
      block_id: `block_${Date.now()}`,
      text_content: selectedText,
      start_time: 0,
      end_time: 0,
      order_index: prev.length,
    }]);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const addEmptyBlock = () => {
    setBlocks(prev => [...prev, {
      block_id: `block_${Date.now()}`,
      text_content: "",
      start_time: 0,
      end_time: 0,
      order_index: prev.length,
    }]);
  };

  const checkOverlap = (updatedBlocks, changedBlockId) => {
    const sorted = [...updatedBlocks].sort((a, b) => a.start_time - b.start_time);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (a.end_time > b.start_time) {
        return `Bloco conflita com outro bloco (${formatTime(b.start_time)} – ${formatTime(a.end_time)}).`;
      }
    }
    for (const b of updatedBlocks) {
      if (b.start_time >= b.end_time && b.end_time > 0) {
        return `START deve ser menor que END no mesmo bloco.`;
      }
    }
    return null;
  };

  const updateBlock = (blockId, field, value) => {
    setBlocks(prev => {
      const updated = prev.map(b => b.block_id === blockId ? { ...b, [field]: value } : b);
      const err = checkOverlap(updated, blockId);
      setOverlapError(err);
      if (field === "start_time" || field === "end_time") {
        return [...updated].sort((a, b) => a.start_time - b.start_time).map((b, i) => ({ ...b, order_index: i }));
      }
      return updated;
    });
  };

  const deleteBlock = (blockId) => {
    setBlocks(prev => prev.filter(b => b.block_id !== blockId).map((b, i) => ({ ...b, order_index: i })));
  };

  const handleSave = async () => {
    if (overlapError) return;
    setSaving(true);
    const cleanBlocks = blocks.map((b, i) => ({
      block_id: b.block_id,
      text_content: b.text_content,
      start_time: b.start_time,
      end_time: b.end_time,
      order_index: i,
    }));
    
    await supabase.from('songs').update({ timecode_blocks: cleanBlocks }).eq('id', id);
    
    setSaving(false);
    navigate(`/songs/${id}`);
  };

  const stopPreview = () => {
    setIsPreviewPlaying(false);
    if (previewTimer.current) {
      cancelAnimationFrame(previewTimer.current);
      previewTimer.current = null;
    }
    if (previewRef.current) previewRef.current.scrollTop = 0;
  };

  const startPreview = () => {
    if (!previewRef.current || blocks.length === 0) return;
    const container = previewRef.current;
    container.scrollTop = 0;
    const sortedBlocks = [...blocks].sort((a, b) => a.start_time - b.start_time);
    const fullText = song?.lyrics_text || "";
    const startWallTime = performance.now();

    const animate = (now) => {
      const elapsedSec = (now - startWallTime) / 1000;
      const lastEnd = sortedBlocks[sortedBlocks.length - 1]?.end_time || 0;
      if (elapsedSec > lastEnd + 1) {
        setIsPreviewPlaying(false);
        return;
      }
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const active = sortedBlocks.find(b => elapsedSec >= b.start_time && elapsedSec <= b.end_time);
      if (active && scrollHeight > 0 && fullText) {
        const charStart = fullText.indexOf(active.text_content);
        const charEnd = charStart + active.text_content.length;
        if (charStart >= 0) {
          const s = (charStart / fullText.length) * scrollHeight;
          const e = (charEnd / fullText.length) * scrollHeight;
          const progress = Math.min((elapsedSec - active.start_time) / Math.max(active.end_time - active.start_time, 0.01), 1);
          container.scrollTop = s + (e - s) * progress;
        }
      }
      previewTimer.current = requestAnimationFrame(animate);
    };
    previewTimer.current = requestAnimationFrame(animate);
    setIsPreviewPlaying(true);
  };

  if (!song) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center -ml-2 hover:opacity-60 active:opacity-40 transition-opacity">
              <ArrowLeft size={20} className="pointer-events-none" />
            </button>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none mb-0.5">Editor de Timecode</p>
              <h1 className="font-black text-base uppercase tracking-wide leading-none">{song.title}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{song.artist} · ref: {formatTime(song.duration_seconds || 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">{blocks.length} bloco{blocks.length !== 1 ? "s" : ""}</span>
            {overlapError && (
              <span className="text-xs text-red-500 max-w-[200px] text-right font-bold">⚠ {overlapError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !!overlapError}
              title={overlapError || ""}
              className="px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {selectedText && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-amber-800 truncate flex-1">"{selectedText.slice(0, 80)}{selectedText.length > 80 ? "..." : ""}"</p>
              <button
                onClick={createBlockFromSelection}
                className="px-3 py-1.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg hover:opacity-80 transition-opacity flex-shrink-0"
              >
                Criar Bloco
              </button>
            </div>
          )}

          {blocks.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-bold">
              <p className="text-sm mb-1 uppercase tracking-widest">Nenhum bloco ainda.</p>
              <p className="text-xs">Selecione o texto da letra na barra lateral ou clique em "+" para criar.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {blocks.map((block, idx) => (
              <BlockCard
                key={block.block_id}
                block={block}
                index={idx}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                formatTime={formatTime}
              />
            ))}
            <button
              onClick={addEmptyBlock}
              className="min-h-[180px] border-4 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-300 hover:border-black hover:text-black transition-colors gap-2"
            >
              <Plus size={28} />
              <span className="text-xs font-black uppercase tracking-widest">Novo Bloco</span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex w-72 xl:w-80 border-l-4 border-black flex-col flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 border-b-4 border-black bg-white">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-black">Preview Visual</p>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5">Selecione texto para criar bloco</p>
            </div>
            <button
              onClick={isPreviewPlaying ? stopPreview : startPreview}
              className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity"
            >
              {isPreviewPlaying ? <Square size={13} fill="white" /> : <Play size={13} fill="white" />}
            </button>
          </div>
          <div
            ref={previewRef}
            onMouseUp={handleTextSelect}
            className="flex-1 overflow-y-auto p-4 bg-gray-50 select-text cursor-text"
            style={{ scrollbarWidth: "thin" }}
          >
            <p className="text-[10px] tracking-[0.2em] uppercase font-black text-black/30 mb-3">Sua Letra</p>
            <pre className="text-sm whitespace-pre-wrap font-sans font-bold leading-7 text-black">
              {song.lyrics_text || "Sem letra cadastrada."}
            </pre>
            <div className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockCard({ block, index, onUpdate, onDelete, formatTime }) {
  const [startStr, setStartStr] = useState(() => formatTime(block.start_time));
  const [endStr, setEndStr] = useState(() => formatTime(block.end_time));

  const parseTime = (str) => {
    const parts = (str || "0:00").split(":");
    if (parts.length === 2) return (parseInt(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
    return parseFloat(str) || 0;
  };

  const commitStart = () => {
    const val = parseTime(startStr);
    setStartStr(formatTime(val));
    onUpdate(block.block_id, "start_time", val);
  };

  const commitEnd = () => {
    const val = parseTime(endStr);
    setEndStr(formatTime(val));
    onUpdate(block.block_id, "end_time", val);
  };

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black tracking-widest text-black uppercase">
          Bloco {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-black/50 font-bold text-[10px] uppercase">Start</span>
            <input
              value={startStr}
              onChange={e => setStartStr(e.target.value)}
              onBlur={commitStart}
              className="w-12 font-black text-center bg-gray-100 border border-gray-300 rounded-md py-0.5 text-xs outline-none focus:border-black"
              placeholder="0:00"
            />
            <span className="text-black/50 font-bold text-[10px] uppercase ml-1">End</span>
            <input
              value={endStr}
              onChange={e => setEndStr(e.target.value)}
              onBlur={commitEnd}
              className="w-12 font-black text-center bg-gray-100 border border-gray-300 rounded-md py-0.5 text-xs outline-none focus:border-black"
              placeholder="0:00"
            />
          </div>
          <button onClick={() => onDelete(block.block_id)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5 ml-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <textarea
        value={block.text_content}
        onChange={e => onUpdate(block.block_id, "text_content", e.target.value)}
        placeholder="Texto deste bloco..."
        rows={5}
        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm font-bold leading-6 resize-none outline-none focus:border-black placeholder-gray-400 font-sans"
      />
    </div>
  );
}