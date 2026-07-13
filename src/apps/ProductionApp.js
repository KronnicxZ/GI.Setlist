import React, { useState, useMemo, useEffect } from 'react';
import { useTeamData, orderSetlists, isSetlistToday } from '../hooks/useTeamData';
import { cleanLyricsForProjection, splitIntoSlides, copyText } from '../utils/projection';
import { showToast } from '../utils/toast';

// ─────────────────────────────────────────────────────────────────────────
// Vista PRODUCCIÓN AUDIOVISUAL — dejar Holyrics listo, rápido y sin errores:
//   · Letra limpia por canción (o setlist completo) con etiquetas [CORO]
//     visibles por defecto y toggle de un clic.
//   · Vista previa como DIAPOSITIVAS numeradas (los bloques exactos que
//     Holyrics cortará), con aviso ámbar si un bloque es demasiado largo.
//   · Checklist "ya pegada" por canción (persistido) para no perderse.
//   · Título copiable con un toque (Holyrics lo pide en un campo aparte).
//   · Edición de última hora antes de copiar (no toca la base de datos).
// ─────────────────────────────────────────────────────────────────────────

const norm = (t) =>
  (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const LONG_SLIDE_LINES = 6; // más de esto = diapositiva que puede salirse de pantalla

const DONE_KEY = 'gis.prod.done.v1';
const readDone = () => {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === 'object' ? obj : {};
  } catch (e) {
    return {};
  }
};

const ProductionApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  const { songs, setlists, loading } = useTeamData(API_URL);
  const [query, setQuery] = useState('');
  const [setlistId, setSetlistId] = useState(null);
  // Etiquetas de sección VISIBLES por defecto; un clic las quita. Se recuerda.
  const [keepSections, setKeepSections] = useState(() => {
    try {
      return localStorage.getItem('gis.prod.keepSections') !== '0';
    } catch (e) {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('gis.prod.keepSections', keepSections ? '1' : '0');
    } catch (e) {
      /* sin storage */
    }
  }, [keepSections]);
  useEffect(() => {
    document.title = 'GI Producción — Letras';
  }, []);
  const [openId, setOpenId] = useState(null); // vista previa expandida
  const [editingId, setEditingId] = useState(null); // edición de última hora
  const [edits, setEdits] = useState({}); // { songId: textoEditado } (solo sesión)
  const [done, setDone] = useState(readDone); // { songId: true } (persistido)

  const toggleDone = (id) => {
    setDone((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next));
      } catch (e) {
        /* sin storage */
      }
      return next;
    });
  };

  const orderedSetlists = useMemo(() => orderSetlists(setlists), [setlists]);
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

  // Letra final de una canción: edición de última hora si existe, si no la limpia.
  const finalTextOf = (song) => {
    const id = song.id || song._id;
    if (edits[id] != null) return edits[id];
    return cleanLyricsForProjection(song.lyrics, { keepSections });
  };

  const doneCount = visibleSongs.filter((s) => done[s.id || s._id]).length;

  const handleCopySong = async (song) => {
    const clean = finalTextOf(song);
    if (!clean) {
      showToast('Esta canción no tiene letra cargada', 'error');
      return;
    }
    await copyText(clean);
    showToast(`«${song.title}» copiada — pégala en Holyrics`);
  };

  const handleCopyTitle = async (song) => {
    await copyText(song.title || '');
    showToast('Título copiado');
  };

  const handleCopyAll = async () => {
    const withLyrics = visibleSongs.filter((s) => finalTextOf(s));
    if (!withLyrics.length) {
      showToast('No hay letras para copiar', 'error');
      return;
    }
    const all = withLyrics
      .map((s) => `=== ${s.title}${s.artist ? ' — ' + s.artist : ''} ===\n\n` + finalTextOf(s))
      .join('\n\n\n');
    await copyText(all);
    showToast(`${withLyrics.length} letras copiadas`);
  };

  const handleShare = async () => {
    const data = { title: 'GI Producción — Letras', url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await copyText(data.url);
        showToast('Enlace copiado — compártelo con el equipo');
      }
    } catch (e) {
      /* usuario canceló */
    }
  };

  return (
    // App-shell con scroll PROPIO (html/body llevan overflow hidden global).
    <div
      className="bg-main text-white flex flex-col overflow-hidden h-screen"
      style={{ height: '100dvh' }}
    >
      <header
        className="shrink-0 z-40 bg-main/95 border-b border-white/5 px-4 pb-3"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center justify-between mb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center space-x-2">
            <img src="/gi-logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="text-base font-black leading-tight">
                GI <span className="text-primary">Producción</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Letras para Holyrics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500">
              {doneCount}/{visibleSongs.length} listas
            </span>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 active:text-white"
              title="Compartir enlace"
              aria-label="Compartir enlace"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.56 15.08,18.78 15.08,19C15.08,20.61 16.39,21.92 18,21.92C19.61,21.92 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z"
                />
              </svg>
            </button>
            <button
              onClick={handleCopyAll}
              className="px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/25 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-transform"
            >
              Copiar todo
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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
                  <span
                    className={`mr-1.5 text-[9px] font-black px-1 py-0.5 rounded ${setlistId === sl.id ? 'bg-black/20' : 'bg-primary text-black'}`}
                  >
                    HOY
                  </span>
                )}
                {sl.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-white/5">
              <button
                onClick={() => setKeepSections(true)}
                className={`px-4 py-2 text-[11px] font-bold transition-colors ${keepSections ? 'bg-primary text-black' : 'text-gray-400'}`}
              >
                Con etiquetas
              </button>
              <button
                onClick={() => setKeepSections(false)}
                className={`px-4 py-2 text-[11px] font-bold border-l border-white/10 transition-colors ${!keepSections ? 'bg-primary text-black' : 'text-gray-400'}`}
              >
                Sin etiquetas
              </button>
            </div>
            <span className="text-[10px] text-gray-500">
              {keepSections ? '[CORO], [VERSO]… visibles' : 'solo la letra'}
            </span>
          </div>
        </div>
      </header>

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
                  <div className="w-7 h-7 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 rounded bg-white/10" />
                    <div className="h-2.5 w-1/3 rounded bg-white/10" />
                  </div>
                  <div className="w-16 h-8 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : visibleSongs.length === 0 ? (
            <p className="text-center text-gray-500 py-20 text-sm">No hay canciones.</p>
          ) : (
            visibleSongs.map((song, idx) => {
              const id = song.id || song._id;
              const clean = finalTextOf(song);
              const isOpen = openId === id;
              const isEditing = editingId === id;
              const isDone = !!done[id];
              const slides = isOpen && !isEditing ? splitIntoSlides(clean) : [];
              return (
                <div
                  key={id}
                  className={`rounded-lg border overflow-hidden transition-colors ${isDone ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-white/[0.04] border-white/5'}`}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Checklist "ya pegada" */}
                    <button
                      onClick={() => toggleDone(id)}
                      className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-primary border-primary text-black' : 'border-white/20 text-transparent active:border-primary'}`}
                      title={isDone ? 'Marcar como pendiente' : 'Marcar como pegada en Holyrics'}
                      aria-label="Marcar como lista"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
                        />
                      </svg>
                    </button>
                    {activeSetlist && (
                      <span className="w-5 text-center text-primary font-black text-sm shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Título copiable (Holyrics lo pide en campo aparte) */}
                      <button
                        onClick={() => handleCopyTitle(song)}
                        className="block w-full text-left"
                        title="Tocar para copiar el título"
                      >
                        <h3
                          className={`font-bold text-[15px] truncate ${isDone ? 'line-through text-gray-500' : 'text-white'}`}
                        >
                          {song.title}
                        </h3>
                      </button>
                      <p className="text-xs text-gray-500 truncate">
                        {song.artist || 'Artista desconocido'}
                        {!clean && <span className="text-red-400/80"> · sin letra</span>}
                        {edits[id] != null && <span className="text-primary"> · editada</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setOpenId(isOpen ? null : id);
                        setEditingId(null);
                      }}
                      disabled={!clean}
                      className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
                    >
                      {isOpen ? 'Ocultar' : 'Ver'}
                    </button>
                    <button
                      onClick={() => handleCopySong(song)}
                      disabled={!clean}
                      className="px-4 py-2.5 rounded-lg bg-primary text-black text-[11px] font-black uppercase tracking-wide disabled:opacity-30 active:scale-95 transition-transform"
                    >
                      Copiar
                    </button>
                  </div>

                  {isOpen && clean && (
                    <div className="border-t border-white/5 bg-black/30 px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          {isEditing
                            ? 'Edición de última hora (no cambia la base de datos)'
                            : `${slides.length} diapositivas — así las cortará Holyrics`}
                        </p>
                        <div className="flex items-center gap-2">
                          {edits[id] != null && !isEditing && (
                            <button
                              onClick={() =>
                                setEdits((p) => {
                                  const n = { ...p };
                                  delete n[id];
                                  return n;
                                })
                              }
                              className="text-[10px] font-bold text-gray-500 hover:text-white"
                            >
                              Descartar edición
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (isEditing) setEditingId(null);
                              else {
                                setEdits((p) => (p[id] != null ? p : { ...p, [id]: clean }));
                                setEditingId(id);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${isEditing ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-300 border-white/10'}`}
                          >
                            {isEditing ? 'Listo' : 'Editar'}
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={edits[id] ?? clean}
                          onChange={(e) => setEdits((p) => ({ ...p, [id]: e.target.value }))}
                          rows={12}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-[13px] leading-relaxed text-gray-200 font-sans focus:outline-none focus:border-primary/50 custom-scrollbar"
                        />
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                          {slides.map((slide, i) => {
                            const long = slide.lines.length > LONG_SLIDE_LINES;
                            return (
                              <div
                                key={i}
                                className={`rounded-lg border px-3 py-2 ${long ? 'border-primary/40 bg-primary/[0.04]' : 'border-white/10 bg-white/[0.03]'}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                    Diapositiva {i + 1}
                                    {slide.label && (
                                      <span className="ml-2 px-1.5 py-0.5 rounded bg-primary text-black">
                                        {slide.label}
                                      </span>
                                    )}
                                  </span>
                                  {long && (
                                    <span
                                      className="text-[9px] font-bold text-primary"
                                      title={`Más de ${LONG_SLIDE_LINES} líneas: puede salirse de la pantalla`}
                                    >
                                      ⚠ bloque largo
                                    </span>
                                  )}
                                </div>
                                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-300 font-sans">
                                  {slide.lines.join('\n')}
                                </pre>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default ProductionApp;
