import React, { useState, useMemo, useEffect } from 'react';
import { useTeamData, orderSetlists, isSetlistToday } from '../hooks/useTeamData';
import { cleanLyricsForProjection, copyText } from '../utils/projection';
import { showToast } from '../utils/toast';

// ─────────────────────────────────────────────────────────────────────────
// Vista PRODUCCIÓN — lo más SIMPLE posible: la persona encargada ve la letra
// limpia de cada canción de un vistazo y la copia con UN clic para pegarla en
// Holyrics (Ctrl+V). Sin pasos intermedios, sin menús.
//   · Búsqueda + chips de setlist (HOY primero).
//   · Un botón "Con/Sin etiquetas" ([CORO], [VERSO]…).
//   · Cada canción = tarjeta con su letra visible + botón COPIAR grande.
//   · "Copiar todo" para el setlist completo.
// ─────────────────────────────────────────────────────────────────────────

const norm = (t) =>
  (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Renderiza la letra limpia de forma VISTOSA: las etiquetas de sección
// ("[CORO]", "[VERSO 1]") como píldoras de acento; el resto como texto legible.
// OJO: esto es solo la presentación — lo que se COPIA sigue siendo el texto
// plano `clean` (con los corchetes), que es lo que Holyrics necesita.
function PrettyLyrics({ clean }) {
  const lines = clean.split('\n');
  return (
    <div className="prod-lyrics">
      {lines.map((line, i) => {
        const t = line.trim();
        if (/^\[[^\]]+\]$/.test(t)) {
          return (
            <div key={i} className="prod-label-row">
              <span className="prod-label">{t.replace(/[[\]]/g, '')}</span>
            </div>
          );
        }
        if (t === '') return <div key={i} className="prod-gap" />;
        return (
          <p key={i} className="prod-line">
            {line}
          </p>
        );
      })}
    </div>
  );
}

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

  // Acordeón de UNA sola abierta: abrir otra cierra la anterior.
  const [openId, setOpenId] = useState(null);
  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

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

  const handleCopySong = async (song) => {
    const clean = cleanLyricsForProjection(song.lyrics, { keepSections });
    if (!clean) {
      showToast('Esta canción no tiene letra cargada', 'error');
      return;
    }
    await copyText(clean);
    showToast(`«${song.title}» copiada — pégala en Holyrics con Ctrl+V`);
  };

  const handleCopyAll = async () => {
    const withLyrics = visibleSongs
      .map((s) => ({ s, clean: cleanLyricsForProjection(s.lyrics, { keepSections }) }))
      .filter((x) => x.clean);
    if (!withLyrics.length) {
      showToast('No hay letras para copiar', 'error');
      return;
    }
    const all = withLyrics
      .map(({ s, clean }) => `=== ${s.title}${s.artist ? ' — ' + s.artist : ''} ===\n\n${clean}`)
      .join('\n\n\n');
    await copyText(all);
    showToast(`${withLyrics.length} letras copiadas`);
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
        <div className="flex items-center justify-between mb-3 max-w-4xl mx-auto w-full">
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
          <button
            onClick={handleCopyAll}
            className="px-4 py-2.5 rounded-lg bg-primary text-black text-xs font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            Copiar todo
          </button>
        </div>

        <div className="max-w-4xl mx-auto w-full space-y-2.5">
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
          <div className="flex rounded-lg overflow-hidden border border-white/10 bg-white/5 w-fit">
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
        </div>
      </header>

      <main
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full px-4 py-4"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {loading ? (
            <div className="space-y-3" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/[0.04] border border-white/5 p-4 animate-pulse space-y-3"
                >
                  <div className="h-4 w-1/2 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                  <div className="h-3 w-3/4 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : visibleSongs.length === 0 ? (
            <p className="text-center text-gray-500 py-20 text-sm">No hay canciones.</p>
          ) : (
            visibleSongs.map((song, idx) => {
              const id = song.id || song._id;
              const clean = cleanLyricsForProjection(song.lyrics, { keepSections });
              const isOpen = openId === id;
              return (
                <div
                  key={id}
                  className="rounded-xl bg-white/[0.04] border border-white/5 overflow-hidden"
                >
                  {/* Fila CONTRAÍDA: toca para expandir la letra; Copiar siempre a mano */}
                  <div className="flex items-center gap-3 p-3">
                    <button
                      onClick={() => toggleOpen(id)}
                      className="flex-1 min-w-0 flex items-center gap-3 text-left"
                      aria-expanded={isOpen}
                    >
                      {activeSetlist && (
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-black text-sm flex items-center justify-center">
                          {idx + 1}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-[16px] truncate text-white">
                          {song.title}
                        </span>
                        <span className="block text-xs text-gray-500 truncate">
                          {song.artist || 'Artista desconocido'}
                          {!clean && <span className="text-red-400/80"> · sin letra</span>}
                        </span>
                      </span>
                      <svg
                        className={`shrink-0 w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCopySong(song)}
                      disabled={!clean}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-black text-sm font-black uppercase tracking-wide disabled:opacity-30 active:scale-95 transition-transform"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
                        />
                      </svg>
                      Copiar
                    </button>
                  </div>

                  {/* Letra SOLO cuando se expande la fila */}
                  {isOpen &&
                    (clean ? (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <PrettyLyrics clean={clean} />
                      </div>
                    ) : (
                      <p className="px-4 py-4 text-sm text-gray-600 italic border-t border-white/5">
                        Sin letra cargada en LivePads.
                      </p>
                    ))}
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
