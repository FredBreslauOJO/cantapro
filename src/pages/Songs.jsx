import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Search, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

export default function Songs() {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadSongs();
  }, [user]);

  const loadSongs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('created_by', user.email)
      .order('created_date', { ascending: false });
    
    if (!error && data) {
      setSongs(data);
    }
    setLoading(false);
  };

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist || "").toLowerCase().includes(search.toLowerCase())
  );

  const groupedSongs = filtered.reduce((acc, song) => {
    const sortKey = (song[sortBy] || "Desconhecido").trim().toUpperCase();
    const firstLetter = sortKey.charAt(0).match(/[A-Z]/) ? sortKey.charAt(0) : "#";
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(song);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedSongs).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="py-6 max-w-2xl mx-auto px-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/50 hover:text-black transition-colors">
            <ArrowLeft size={14} /> Voltar para Setlists
          </button>
          <p className="text-xs tracking-[0.15em] uppercase text-gray-400 mb-0.5">Biblioteca</p>
          <h1 className="text-2xl font-black tracking-tight uppercase text-foreground">Editar Letras</h1>
        </div>
        <div className="flex items-center gap-2 mt-8">
          <button
            onClick={() => navigate("/songs/new")}
            className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity active:scale-95 transition-transform"
          >
            <Plus size={18} className="pointer-events-none" />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-5 mt-3" />

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar música ou artista..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-black/10 transition font-bold"
        />
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-full max-w-[240px]">
        <button
          onClick={() => setSortBy("title")}
          className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase active:scale-95 ${sortBy === "title" ? "bg-white shadow-sm text-foreground" : "text-gray-400"}`}
        >
          <span className="pointer-events-none">Por Título</span>
        </button>
        <button
          onClick={() => setSortBy("artist")}
          className={`flex-1 min-h-[44px] rounded-lg text-[10px] font-bold tracking-wide transition-all uppercase active:scale-95 ${sortBy === "artist" ? "bg-white shadow-sm text-foreground" : "text-gray-400"}`}
        >
          <span className="pointer-events-none">Por Artista</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Nenhuma música encontrada.</p>
          <button
            onClick={() => navigate("/songs/new")}
            className="px-6 py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-opacity active:scale-95 transition-transform"
          >
            Adicionar primeira música
          </button>
        </div>
      ) : (
        <div className="pb-20">
          {sortedLetters.map(letter => (
            <div key={letter} className="mb-4">
              <div className="sticky top-0 z-10 bg-white py-1 mb-2 border-b-2 border-black">
                <span className="text-sm font-black text-black">{letter}</span>
              </div>
              <div className="space-y-1">
                {groupedSongs[letter]
                  .sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""))
                  .map(song => (
                    <button
                      key={song.id}
                      onClick={() => navigate(`/songs/${song.id}`)}
                      className="w-full flex items-center justify-between px-3 min-h-[52px] border-b-2 border-black/10 hover:bg-black hover:text-white transition-colors group cursor-pointer rounded-lg text-left active:scale-[0.99] transition-transform"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-sm uppercase tracking-tight text-black group-hover:text-white truncate flex items-center gap-2">
                          {song.title}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 group-hover:text-white/60 truncate mt-0.5">{song.artist}</p>
                      </div>
                      <Pencil size={12} className="text-black/30 group-hover:text-white/60 transition-colors flex-shrink-0 ml-3" />
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}