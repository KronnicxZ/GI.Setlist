import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useTeamData, orderSetlists, isSetlistToday } from '../hooks/useTeamData';
import { extractYoutubeVideoId } from '../utils/youtube';

// Vista de letra dedicada estilo LivePads (ligera): toolbar tono/BPM/transpose/
// A±/acordes + reproductor compacto tipo MP3 (YouTube oculto) + letra fullscreen.
const SingerView = lazy(() => import('../components/SingerView'));

const norm = (t) =>
  (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const SingersApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  const { songs, setlists, loading } = useTeamData(API_URL);
  const [query, setQuery] = useState('');
  const [setlistId, setSetlistId] = useState(null); // null = todas
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = 'GI Cantantes — Letras y Tono';
  }, []);

  const orderedSetlists = useMemo(() => orderSetlists(setlists), [setlists]);

  // La lista de HOY se selecciona sola la primera vez (lo que un cantante
  // busca el domingo, sin tocar nada). Si el usuario elige otra, se respeta.
  const autoSel = useRef(false);
  useEffect(() => {
    if (autoSel.current || !orderedSetlists.length) return;
    const today = orderedSetlists.find((sl) => isSetlistToday(sl));
    if (today) setSetlistId(today.id);
    autoSel.current = true;
  }, [orderedSetlists]);

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
    // App-shell con scroll PROPIO: html/body llevan overflow hidden global (la
    // app principal scrollea por paneles), así que el <main> de abajo es el
    // contenedor scrolleable — sin esto la lista no se podía desplazar.
    <div
      className="bg-main text-white flex flex-col overflow-hidden h-screen"
      style={{ height: '100dvh' }}
    >
      {/* Header fijo, pensado para el móvil de un cantante */}
      <header
        className="shrink-0 z-40 bg-main/95 border-b border-white/5 px-4 pb-3"
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500">
              {visibleSongs.length} temas
            </span>
            <button
              onClick={async () => {
                const data = { title: 'GI Cantantes', url: window.location.href };
                try {
                  if (navigator.share) await navigator.share(data);
                  else {
                    await navigator.clipboard.writeText(data.url);
                    const { showToast } = await import('../utils/toast');
                    showToast('Enlace copiado — compártelo con el equipo');
                  }
                } catch (e) {
                  /* usuario canceló el share */
                }
              }}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 active:text-white"
              title="Compartir enlace con el equipo"
              aria-label="Compartir enlace"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.56 15.08,18.78 15.08,19C15.08,20.61 16.39,21.92 18,21.92C19.61,21.92 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-2.5">
          <input
            type="search"
            placeholder="Buscar canción o artista…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
          {setlists.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setSetlistId(null)}
                className={`shrink-0 px-4 py-2 rounded-md text-xs font-bold border transition-colors ${!setlistId ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
              >
                Todas
              </button>
              {orderedSetlists.map((sl) => (
                <button
                  key={sl.id}
                  onClick={() => setSetlistId(sl.id)}
                  className={`shrink-0 px-4 py-2 rounded-md text-xs font-bold border transition-colors ${setlistId === sl.id ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
                >
                  {isSetlistToday(sl) && (
                    <span className={`mr-1.5 text-[9px] font-black px-1 py-0.5 rounded ${setlistId === sl.id ? 'bg-black/20' : 'bg-primary text-black'}`}>
                      HOY
                    </span>
                  )}
                  {sl.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Lista de canciones — filas grandes, un toque abre la letra */}
      <main
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full px-4 py-4"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-3xl mx-auto space-y-2">
        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/5 animate-pulse"
              >
                <div className="w-12 h-12 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 rounded bg-white/10" />
                  <div className="h-2.5 w-1/3 rounded bg-white/10" />
                </div>
                <div className="w-8 h-6 rounded bg-white/10" />
              </div>
            ))}
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
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.04] border border-white/5 active:scale-[0.98] active:bg-white/[0.08] transition-[transform,background-color] text-left"
              >
                {activeSetlist && (
                  <span className="w-6 text-center text-primary font-black text-sm shrink-0">
                    {idx + 1}
                  </span>
                )}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
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
        </div>
      </main>

      {selected && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          <SingerView
            song={selected}
            videoId={extractYoutubeVideoId(selected.youtubeUrl)}
            onClose={() => setSelected(null)}
            playlist={visibleSongs}
            onNavigate={setSelected}
          />
        </Suspense>
      )}
    </div>
  );
};

export default SingersApp;
