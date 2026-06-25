import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Download, Trash2, Check, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

export default function SongEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === "new";
  
  const [editing, setEditing] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [durationMin, setDurationMin] = useState("0");
  const [durationSec, setDurationSec] = useState("0");
  const [lyrics, setLyrics] = useState("");

  useEffect(() => {
    if (!isNew && user) {
      loadSong();
    }
  }, [id, user]);

  const loadSong = async () => {
    const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
    if (data && !error) {
      setTitle(data.title || "");
      setArtist(data.artist || "");
      const totalSec = data.duration_seconds || 0;
      setDurationMin(String(Math.floor(totalSec / 60)));
      setDurationSec(String(totalSec % 60));
      setLyrics(data.lyrics_text || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const totalSec = (parseInt(durationMin) || 0) * 60 + (parseInt(durationSec) || 0);
    const songData = { 
      title, 
      artist, 
      duration_seconds: totalSec, 
      lyrics_text: lyrics,
      created_by: user.email 
    };

    if (isNew) {
      await supabase.from('songs').insert([songData]);
      navigate("/songs");
    } else {
      await supabase.from('songs').update(songData).eq('id', id);
      setEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Remover esta música?")) return;
    await supabase.from('songs').delete().eq('id', id);
    navigate("/songs");
  };

  const handleDownload = () => {
    const content = `${title}\n${artist}\n\n${lyrics}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center -ml-3 text-foreground hover:opacity-60 active:opacity-40 transition-opacity">
          <ArrowLeft size={22} className="pointer-events-none" />
        </button>
        <div className="flex items-center gap-3">
          {!isNew && (
            <>
              <button onClick={() => setEditing(!editing)} className="p-2 text-foreground hover:opacity-60 transition-opacity">
                {editing ? <Check size={20} /> : <Pencil size={20} />}
              </button>
              <button onClick={() => navigate(`/songs/${id}/timecode`)} className="p-2 text-foreground hover:opacity-60 transition-opacity">
                <Clock size={20} />
              </button>
              <button onClick={handleDownload} className="p-2 text-foreground hover:opacity-60 transition-opacity">
                <Download size={20} />
              </button>
              <button onClick={handleDelete} className="p-2 text-red-400 hover:opacity-60 transition-opacity">
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="TÍTULO DA MÚSICA"
              className="w-full text-xl font-black uppercase tracking-tight bg-transparent border-b-4 border-black py-1 outline-none placeholder-black/20"
            />
            <input
              type="text" value={artist} onChange={e => setArtist(e.target.value)}
              placeholder="NOME DO ARTISTA"
              className="w-full text-sm font-bold uppercase tracking-widest bg-transparent border-b-2 border-black/30 py-1 outline-none placeholder-black/20 focus:border-black"
            />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-widest text-black/40">Duração:</span>
              <input
                type="number" min="0" max="59" value={durationMin} onChange={e => setDurationMin(e.target.value)}
                className="w-14 text-sm font-bold text-center border-2 border-black/20 rounded-lg py-1 outline-none focus:border-black"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-black/40">min</span>
              <input
                type="number" min="0" max="59" value={durationSec} onChange={e => setDurationSec(e.target.value)}
                className="w-14 text-sm font-bold text-center border-2 border-black/20 rounded-lg py-1 outline-none focus:border-black"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-black/40">seg</span>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-black">{title}</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-black/50">{artist}</p>
            {((parseInt(durationMin) || 0) + (parseInt(durationSec) || 0)) > 0 && (
              <p className="text-xs font-bold uppercase tracking-widest text-black/40 mt-2">
                Duração: {durationMin}:{durationSec.padStart(2, "0")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-2 border-black rounded-3xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {editing ? (
          <textarea
            value={lyrics} onChange={e => setLyrics(e.target.value)}
            placeholder="DIGITE OU COLE A LETRA AQUI"
            rows={18}
            className="w-full bg-transparent p-6 text-sm leading-8 outline-none resize-none placeholder-black/20 font-mono font-bold text-black"
            style={{ lineHeight: "32px" }}
          />
        ) : (
          <div className="p-6">
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-black/30 mb-3">LETRA</p>
            <pre className="text-sm whitespace-pre-wrap font-sans font-bold leading-8 text-black">{lyrics || "Nenhuma letra adicionada."}</pre>
          </div>
        )}
      </div>

      {editing && (
        <button
          onClick={handleSave}
          disabled={saving || !title}
          className="mt-5 w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-80 transition-opacity disabled:opacity-40 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
        >
          {saving ? "Salvando..." : isNew ? "Criar Música" : "Salvar Alterações"}
        </button>
      )}
    </div>
  );
}