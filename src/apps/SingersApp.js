import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useData } from '../hooks/useData';
import { extractYoutubeVideoId } from '../utils/youtube';

// El PlayerModal ya trae TODO lo que un cantante necesita: letra grande con
// zoom A−/A+, transposición de tono, metrónomo y la canción (YouTube). Aquí
// solo construimos una portada simple y sin distracciones para llegar a él.
const PlayerModal = lazy(() => import('../components/PlayerModal'));

const norm = (t) =>
  (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const SingersApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  const { songs, setlists, loading } = useData(API_URL);
  const [query, setQuery] = useState('');
  const [setlistId, setSetlistId] = useState(null); // null = todas
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = 'GI Cantantes — Letras y Tono';
  }, []);

  const activeSetlist = setlists.find((s) => s.id === setlistId) || null;

  const visibleSongs = useMemo(() => {
    let list = songs;
    if (activeSetlist) {
      const ids = (activeSetlist.songs || []).map((s) => (s.id || s._id || s)?.toString());
      list = ids.map((id) => songs.find((x) => (x.id || x._id)?.toString() === id)).filter(Boolean);
    }
    const q = norm(query.trim());
    if (q) list = list.filter((s) => norm(s.title).includes(q) || norm(s.artist).includes(q));
    if (!activeSetlist) list = [...list].sort((a, b) => norm(a.title).localeCompare(norm(b.title)));
    return list;
  }, [songs, activeSetlist, query]);

  return (
    <div className="min-h-screen bg-main text-white flex flex-col">
      {/* Header fijo, pensado para el móvil de un cantante */}
      <header
        className="sticky top-0 z-40 bg-main/95 backdrop-blur-md border-b border-white/5 px-4 pb-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center space-x-2">
            <img src="/gi-logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="text-base font-black leading-tight">
                GI <span className="text-primary">Cantantes</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Letra · Tono · Metrónomo
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-gray-500">{visibleSongs.length} temas</span>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-2.5">
          <input
            type="search"
            placeholder="Buscar canción o artista…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
          {setlists.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setSetlistId(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${!setlistId ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
              >
                Todas
              </button>
              {setlists.map((sl) => (
                <button
                  key={sl.id}
                  onClick={() => setSetlistId(sl.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${setlistId === sl.id ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
                >
                  {sl.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Lista de canciones — filas grandes, un toque abre la letra */}
      <main
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 space-y-2"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {loading ? (
          <div className="flex flex-col items-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando repertorio…</p>
          </div>
        ) : visibleSongs.length === 0 ? (
          <p className="text-center text-gray-500 py-20 text-sm">
            No hay canciones {query ? 'que coincidan con la búsqueda' : 'en esta lista'}.
          </p>
        ) : (
          visibleSongs.map((song, idx) => {
            const vId = extractYoutubeVideoId(song.youtubeUrl);
            return (
              <button
                key={song.id || song._id}
                onClick={() => setSelected(song)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5 active:scale-[0.98] active:bg-white/[0.08] transition-[transform,background-color] text-left"
              >
                {activeSetlist && (
                  <span className="w-6 text-center text-primary font-black text-sm shrink-0">
                    {idx + 1}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  {vId ? (
                    <img
                      src={`https://img.youtube.com/vi/${vId}/default.jpg`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] text-white truncate">{song.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {song.artist || 'Artista desconocido'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[12px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    {song.key || '—'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {song.bpm ? `${song.bpm} BPM` : ''}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </main>

      {selected && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          <PlayerModal song={selected} onClose={() => setSelected(null)} />
        </Suspense>
      )}
    </div>
  );
};

export default SingersApp;
