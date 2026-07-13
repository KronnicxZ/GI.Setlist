import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { cleanLyricsForProjection, copyText } from '../utils/projection';
import { showToast } from '../utils/toast';

// Vista para el equipo de PRODUCCIÓN AUDIOVISUAL: letra LIMPIA (sin acordes ni
// etiquetas, bloques separados por línea en blanco) lista para copiar y pegar
// en Holyrics, canción por canción o el setlist completo.

const norm = (t) =>
  (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const ProductionApp = () => {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  const { songs, setlists, loading } = useData(API_URL);
  const [query, setQuery] = useState('');
  const [setlistId, setSetlistId] = useState(null);
  const [keepSections, setKeepSections] = useState(false);
  const [openId, setOpenId] = useState(null); // vista previa expandida

  const activeSetlist = setlists.find((s) => s.id === setlistId) || null;

  const visibleSongs = useMemo(() => {
    let list = songs;
    if (activeSetlist) {
      const ids = (activeSetlist.songs || []).map((s) => (s.id || s._id || s)?.toString());
      list = ids.map((id) => songs.find((x) => (x.id || x._id)?.toString() === id)).filter(Boolean);
    }
    const q = norm(query.trim());
    if (q) list = list.filter((s) => norm(s.title).includes(q) || norm(s.artist).includes(q));
    return list;
  }, [songs, activeSetlist, query]);

  const handleCopySong = async (song) => {
    const clean = cleanLyricsForProjection(song.lyrics, { keepSections });
    if (!clean) {
      showToast('Esta canción no tiene letra cargada', 'error');
      return;
    }
    await copyText(clean);
    showToast(`«${song.title}» copiada — pégala en Holyrics`);
  };

  const handleCopyAll = async () => {
    const withLyrics = visibleSongs.filter((s) =>
      cleanLyricsForProjection(s.lyrics, { keepSections })
    );
    if (!withLyrics.length) {
      showToast('No hay letras para copiar', 'error');
      return;
    }
    const all = withLyrics
      .map(
        (s) =>
          `=== ${s.title}${s.artist ? ' — ' + s.artist : ''} ===\n\n` +
          cleanLyricsForProjection(s.lyrics, { keepSections })
      )
      .join('\n\n\n');
    await copyText(all);
    showToast(`${withLyrics.length} letras copiadas`);
  };

  return (
    <div className="min-h-screen bg-main text-white flex flex-col">
      <header
        className="sticky top-0 z-40 bg-main/95 backdrop-blur-md border-b border-white/5 px-4 pb-3"
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
          <button
            onClick={handleCopyAll}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/25 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            Copiar todo
          </button>
        </div>

        <div className="max-w-3xl mx-auto w-full space-y-2.5">
          <input
            type="search"
            placeholder="Buscar canción o artista…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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
          <label className="flex items-center gap-2 text-[11px] text-gray-400 font-medium select-none w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={keepSections}
              onChange={(e) => setKeepSections(e.target.checked)}
              className="w-4 h-4 accent-[#FBAE00]"
            />
            Incluir etiquetas de sección (CORO, VERSO…)
          </label>
        </div>
      </header>

      <main
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 space-y-2"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {loading ? (
          <div className="flex flex-col items-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando letras…</p>
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
                className="rounded-2xl bg-white/[0.04] border border-white/5 overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3">
                  {activeSetlist && (
                    <span className="w-6 text-center text-primary font-black text-sm shrink-0">
                      {idx + 1}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] text-white truncate">{song.title}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {song.artist || 'Artista desconocido'}
                      {!clean && <span className="text-red-400/80"> · sin letra</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenId(isOpen ? null : id)}
                    disabled={!clean}
                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold disabled:opacity-30 active:scale-95 transition-transform"
                  >
                    {isOpen ? 'Ocultar' : 'Ver'}
                  </button>
                  <button
                    onClick={() => handleCopySong(song)}
                    disabled={!clean}
                    className="px-4 py-2.5 rounded-xl bg-primary text-black text-[11px] font-black uppercase tracking-wide disabled:opacity-30 active:scale-95 transition-transform"
                  >
                    Copiar
                  </button>
                </div>
                {isOpen && clean && (
                  <div className="border-t border-white/5 bg-black/30 px-4 py-3">
                    <p className="text-[10px] text-gray-500 mb-2 font-bold uppercase tracking-wider">
                      Vista previa — cada línea en blanco = nueva diapositiva en Holyrics
                    </p>
                    <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-300 font-sans max-h-80 overflow-y-auto">
                      {clean}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default ProductionApp;
