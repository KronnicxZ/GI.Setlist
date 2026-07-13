import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import parse from 'html-react-parser';
import { transposeText, formatLyricsForDisplay, NOTES } from '../utils/chordTransposer';
import { cleanLyricsForProjection } from '../utils/projection';

// ─────────────────────────────────────────────────────────────────────────
// Vista CANTANTE — letra a pantalla completa estilo LivePads, ultra ligera:
//   · Toolbar: tono (y tono del VOCALISTA si existe), transpose ▼0▲, A−/A+,
//     Con acordes/Solo letra (persistido), metrónomo de un toque.
//   · Reproductor tipo MP3 al PIE (YouTube oculto en 1px, controlado por API),
//     con video expandible, y navegación ◀ ▶ por el setlist sin salir de la
//     letra ("3/7").
//   · Auto-scroll tipo teleprompter (OFF→1x→2x→3x; cualquier toque lo pausa).
//   · Wake Lock (pantalla encendida) y botón atrás del teléfono = cerrar.
// Nota: transponer el AUDIO de YouTube no es posible en web; el transpose es
// de acordes/tono visual.
// ─────────────────────────────────────────────────────────────────────────

const LYRIC_SIZE_KEY = 'gis.lyricSize';
const SIZE_MIN = 14;
const SIZE_MAX = 34;
const readSize = () => {
  try {
    const n = parseInt(localStorage.getItem(LYRIC_SIZE_KEY), 10);
    if (Number.isFinite(n)) return Math.min(SIZE_MAX, Math.max(SIZE_MIN, n));
  } catch (e) {
    /* sin storage */
  }
  return 19;
};

const fmtTime = (s) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, '0')}`;
};

const SCROLL_SPEEDS = [0, 0.4, 0.8, 1.4]; // px por frame aprox (~24/48/84 px/s)

const SingerView = ({ song, videoId, onClose, playlist = [], onNavigate }) => {
  const [semitones, setSemitones] = useState(0);
  // Por defecto SOLO LETRA (lo que un cantante quiere leer); se recuerda.
  const [showChords, setShowChords] = useState(() => {
    try {
      return localStorage.getItem('gis.singer.chords') === '1';
    } catch (e) {
      return false;
    }
  });
  const toggleChords = () => {
    setShowChords((prev) => {
      try {
        localStorage.setItem('gis.singer.chords', prev ? '0' : '1');
      } catch (e) {
        /* sin storage */
      }
      return !prev;
    });
  };
  const [lyricSize, setLyricSize] = useState(readSize);
  const [showVideo, setShowVideo] = useState(false);

  // ── Posición en el setlist (navegación ◀ ▶ sin salir de la letra) ──
  const songId = (song.id || song._id)?.toString();
  const idx = playlist.findIndex((s) => (s.id || s._id)?.toString() === songId);
  const prevSong = idx > 0 ? playlist[idx - 1] : null;
  const nextSong = idx >= 0 && idx < playlist.length - 1 ? playlist[idx + 1] : null;

  const mainRef = useRef(null);
  const navigateTo = useCallback(
    (target) => {
      if (!target || !onNavigate) return;
      setSemitones(0); // cada canción arranca en su tono
      setShowVideo(false);
      if (mainRef.current) mainRef.current.scrollTop = 0;
      onNavigate(target);
    },
    [onNavigate]
  );

  // ── Reproductor (YouTube oculto, UI de MP3) ──
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const tickRef = useRef(null);

  // ── Metrónomo compacto (Tone.js diferido) ──
  const [metroOn, setMetroOn] = useState(false);
  const toneRef = useRef(null);
  const synthRef = useRef(null);
  const repeatRef = useRef(null);

  // ── Auto-scroll (teleprompter) ──
  const [scrollSpeed, setScrollSpeed] = useState(0); // índice en SCROLL_SPEEDS
  const rafRef = useRef(null);
  const accRef = useRef(0);

  useEffect(() => {
    document.title = `${song.title} — GI Cantantes`;
  }, [song.title]);

  // Pantalla SIEMPRE encendida mientras la letra está abierta (Wake Lock).
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if (navigator.wakeLock) lock = await navigator.wakeLock.request('screen');
      } catch (e) {
        /* no soportado / denegado: sin drama */
      }
    };
    request();
    const onVis = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try {
        if (lock) lock.release();
      } catch (e) {
        /* ya liberado */
      }
    };
  }, []);

  // Botón ATRÁS del teléfono = cerrar la letra (no salir de la app).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedByPop = useRef(false);
  useEffect(() => {
    window.history.pushState({ singerView: true }, '');
    const onPop = () => {
      closedByPop.current = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!closedByPop.current) window.history.back();
    };
  }, []);

  const changeSize = (d) => {
    setLyricSize((prev) => {
      const next = Math.min(SIZE_MAX, Math.max(SIZE_MIN, prev + d));
      try {
        localStorage.setItem(LYRIC_SIZE_KEY, String(next));
      } catch (e) {
        /* sin storage */
      }
      return next;
    });
  };

  // Tono actual (badge) según transposición
  const keyOf = useCallback((base, semis) => {
    const b = (base || '').trim();
    if (!b) return null;
    const isMinor = /m$/i.test(b) && !/maj/i.test(b);
    const root = b.replace(/m$/i, '');
    const norm = root.length > 1 ? root[0].toUpperCase() + root[1] : root.toUpperCase();
    const i = NOTES.indexOf(norm);
    if (i === -1) return b;
    return NOTES[(i + semis + 120) % 12] + (isMinor ? 'm' : '');
  }, []);
  const currentKey = keyOf(song.key || song.originalKey, semitones) || '—';
  const vocalistKey = song.vocalistKey ? keyOf(song.vocalistKey, 0) : null;

  // Letra memoizada. CON acordes: transpuesta con cifrado encima. SOLO LETRA:
  // pasa por el limpiador — las líneas de cifrado desaparecen del todo.
  const renderedLyrics = useMemo(() => {
    if (!song.lyrics)
      return <p className="text-gray-600 italic">No hay letra disponible para esta canción.</p>;
    const source = showChords
      ? transposeText(song.lyrics, semitones)
      : cleanLyricsForProjection(song.lyrics, { keepSections: true });
    return parse(formatLyricsForDisplay(source));
  }, [song.lyrics, semitones, showChords]);

  // ── YouTube: un solo player; al navegar de canción se re-cuea el video ──
  useEffect(() => {
    if (!videoId) {
      // Canción sin video: para el audio del anterior si lo había.
      if (playerRef.current && playerRef.current.stopVideo) playerRef.current.stopVideo();
      setPlaying(false);
      setCur(0);
      setDur(0);
      return undefined;
    }
    let cancelled = false;

    const create = () => {
      if (cancelled) return;
      new window.YT.Player('singer-audio-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            playerRef.current = e.target;
            setPlayerReady(true);
            setDur(e.target.getDuration() || 0);
          },
          onStateChange: (e) => {
            setPlaying(e.data === 1);
            if (e.data === 1 && e.target.getDuration) setDur(e.target.getDuration() || 0);
          },
        },
      });
    };

    if (playerRef.current && playerRef.current.cueVideoById) {
      // Player ya creado (venimos de otra canción): solo cambia el video.
      playerRef.current.cueVideoById(videoId);
      setPlaying(false);
      setCur(0);
      setDur(0);
    } else if (window.YT && window.YT.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        create();
      };
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(tag, first);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Tick de progreso (solo re-renderiza al cambiar el segundo visible)
  useEffect(() => {
    if (playing && playerReady) {
      tickRef.current = setInterval(() => {
        const p = playerRef.current;
        const t = p && p.getCurrentTime ? p.getCurrentTime() : 0;
        setCur((prev) => (Math.floor(prev) === Math.floor(t) ? prev : t));
      }, 500);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playing, playerReady]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };
  const seekBy = (s) => {
    const p = playerRef.current;
    if (!p) return;
    const t = Math.max(0, (p.getCurrentTime() || 0) + s);
    p.seekTo(t, true);
    setCur(t);
  };
  const seekTo = (t) => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(t, true);
    setCur(t);
  };

  // ── Metrónomo compacto ──
  const toggleMetro = async () => {
    if (!metroOn) {
      if (!toneRef.current) toneRef.current = await import('tone');
      const Tone = toneRef.current;
      if (Tone.getContext().state !== 'running') await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.001,
          octaves: 1,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination();
      }
      Tone.getTransport().bpm.value = Number(song.bpm) || 120;
      repeatRef.current = Tone.getTransport().scheduleRepeat((time) => {
        synthRef.current.triggerAttackRelease('C5', '32n', time, 0.7);
      }, '4n');
      Tone.getTransport().start('+0.05');
    } else {
      const Tone = toneRef.current;
      if (Tone) {
        if (repeatRef.current !== null) Tone.getTransport().clear(repeatRef.current);
        Tone.getTransport().stop();
      }
    }
    setMetroOn(!metroOn);
  };
  // Al cambiar de canción con el metrónomo andando, sigue con el BPM nuevo.
  useEffect(() => {
    if (metroOn && toneRef.current) {
      toneRef.current.getTransport().bpm.value = Number(song.bpm) || 120;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.bpm]);
  useEffect(
    () => () => {
      const Tone = toneRef.current;
      if (!Tone) return;
      if (synthRef.current) synthRef.current.dispose();
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    },
    []
  );

  // ── Auto-scroll (teleprompter): rAF suave; cualquier toque lo detiene ──
  useEffect(() => {
    const speed = SCROLL_SPEEDS[scrollSpeed] || 0;
    if (!speed) return undefined;
    const step = () => {
      const el = mainRef.current;
      if (el) {
        accRef.current += speed;
        if (accRef.current >= 1) {
          const px = Math.floor(accRef.current);
          accRef.current -= px;
          el.scrollTop += px;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
            setScrollSpeed(0); // llegó al final
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollSpeed]);
  const stopAutoScroll = () => {
    if (scrollSpeed) setScrollSpeed(0);
  };
  const cycleAutoScroll = () => setScrollSpeed((s) => (s + 1) % SCROLL_SPEEDS.length);

  return (
    <div className="fixed inset-0 z-[150] bg-main text-white flex flex-col">
      {/* ── Toolbar estilo LivePads ── */}
      <header
        className="shrink-0 border-b border-white/5 bg-main/95"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center flex-wrap gap-2 px-3 py-2">
          <button
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-300 active:bg-white/10"
            aria-label="Volver"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"
              />
            </svg>
          </button>
          <div className="min-w-0 mr-auto">
            <h2 className="text-sm font-black truncate leading-tight">{song.title}</h2>
            <p className="text-[11px] text-gray-500 truncate">{song.artist}</p>
          </div>

          {/* Tono actual + tono del VOCALISTA (dato clave para quien canta) */}
          <span className="shrink-0 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-black text-sm">
            {currentKey}
          </span>
          {vocalistKey && (
            <span
              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[12px] font-bold text-gray-200"
              title="Tono del vocalista"
            >
              Voz: <span className="text-primary font-black">{vocalistKey}</span>
            </span>
          )}

          {/* BPM + metrónomo */}
          <button
            onClick={toggleMetro}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg border font-bold text-[12px] transition-colors ${metroOn ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-300 border-white/10'}`}
            title="Metrónomo"
          >
            {song.bpm ? `${song.bpm} BPM` : 'BPM'} {metroOn ? '■' : '▶'}
          </button>

          {/* Transpose ▼ 0 ▲ */}
          <div className="shrink-0 flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => setSemitones((s) => Math.max(-6, s - 1))}
              className="px-2.5 py-1.5 text-gray-300 active:bg-white/10 font-black"
              aria-label="Bajar tono"
            >
              ▼
            </button>
            <span
              className={`px-2 font-mono text-[12px] font-bold ${semitones !== 0 ? 'text-primary' : 'text-gray-400'}`}
              onDoubleClick={() => setSemitones(0)}
              title="Doble clic: restaurar"
            >
              {semitones > 0 ? `+${semitones}` : semitones}
            </span>
            <button
              onClick={() => setSemitones((s) => Math.min(6, s + 1))}
              className="px-2.5 py-1.5 text-gray-300 active:bg-white/10 font-black"
              aria-label="Subir tono"
            >
              ▲
            </button>
          </div>

          {/* Zoom A− / A+ */}
          <div className="shrink-0 flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => changeSize(-2)}
              className="px-2.5 py-1.5 text-gray-300 active:bg-white/10 text-[11px] font-black"
              aria-label="Letra más pequeña"
            >
              A−
            </button>
            <button
              onClick={() => changeSize(2)}
              className="px-2.5 py-1.5 text-gray-300 active:bg-white/10 text-[13px] font-black border-l border-white/10"
              aria-label="Letra más grande"
            >
              A+
            </button>
          </div>

          {/* Auto-scroll (teleprompter) */}
          <button
            onClick={cycleAutoScroll}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${scrollSpeed ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
            title="Auto-scroll: un toque cambia la velocidad; tocar la letra lo detiene"
          >
            {scrollSpeed ? `Scroll ${scrollSpeed}x` : 'Auto-scroll'}
          </button>

          {/* Acordes on/off */}
          <button
            onClick={toggleChords}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${showChords ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            {showChords ? 'Con acordes' : 'Solo letra'}
          </button>
        </div>
      </header>

      {/* ── Letra ── */}
      <main
        ref={mainRef}
        onPointerDown={stopAutoScroll}
        onWheel={stopAutoScroll}
        className="flex-1 min-h-0 overflow-y-auto px-5 md:px-10 py-6 custom-scrollbar"
      >
        <div className="max-w-3xl mx-auto">
          {/* Notas del director (dato que antes se perdía) */}
          {song.notes && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                Nota del director
              </p>
              <p className="text-sm text-gray-300 italic leading-relaxed">"{song.notes}"</p>
            </div>
          )}
          <div
            className={`lyrics-view text-gray-200 ${showChords ? '' : 'no-chords'}`}
            style={{ fontSize: `${lyricSize}px` }}
          >
            {renderedLyrics}
          </div>
        </div>
      </main>

      {/* ── Pie: navegación del setlist + reproductor tipo MP3 ── */}
      <footer
        className="shrink-0 border-t border-white/5 bg-main/95 px-3 pt-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Video expandible ENCIMA de la barra (opcional) */}
        {videoId && (
          <div
            className={
              showVideo
                ? 'mb-2 aspect-video w-full max-w-xl mx-auto rounded-lg overflow-hidden bg-black'
                : 'absolute w-px h-px overflow-hidden opacity-0 pointer-events-none'
            }
          >
            <div id="singer-audio-player" className="w-full h-full" />
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-2">
          {/* Navegación por el setlist sin salir de la letra */}
          {playlist.length > 1 && idx >= 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo(prevSong)}
                disabled={!prevSong}
                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-left disabled:opacity-30 active:bg-white/10"
              >
                <span className="text-primary font-black">◀</span>
                <span className="min-w-0">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">
                    Anterior
                  </span>
                  <span className="block text-[12px] font-bold truncate">
                    {prevSong ? prevSong.title : '—'}
                  </span>
                </span>
              </button>
              <span className="shrink-0 px-2 text-[12px] font-mono font-bold text-gray-400">
                {idx + 1}/{playlist.length}
              </span>
              <button
                onClick={() => navigateTo(nextSong)}
                disabled={!nextSong}
                className="flex-1 min-w-0 flex items-center justify-end gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-right disabled:opacity-30 active:bg-white/10"
              >
                <span className="min-w-0">
                  <span className="block text-[9px] text-gray-500 font-bold uppercase">
                    Siguiente
                  </span>
                  <span className="block text-[12px] font-bold truncate">
                    {nextSong ? nextSong.title : '—'}
                  </span>
                </span>
                <span className="text-primary font-black">▶</span>
              </button>
            </div>
          )}

          {/* Barra de reproducción (solo si hay video/canción) */}
          {videoId && (
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2">
              <img
                src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                className="w-9 h-9 rounded-lg object-cover shrink-0"
                alt=""
              />
              <button
                onClick={() => seekBy(-10)}
                className="shrink-0 p-1.5 text-gray-400 active:text-white"
                aria-label="Atrás 10s"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M11.5,12L20,18V6M11,18V6L2.5,12L11,18Z" />
                </svg>
              </button>
              <button
                onClick={togglePlay}
                disabled={!playerReady}
                className="shrink-0 w-11 h-11 rounded-full bg-primary text-black flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                aria-label={playing ? 'Pausar' : 'Reproducir'}
              >
                {playing ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => seekBy(10)}
                className="shrink-0 p-1.5 text-gray-400 active:text-white"
                aria-label="Adelante 10s"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M13,12L4.5,6V18M12.5,6V18L21,12L12.5,6Z" />
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max={Math.max(1, Math.floor(dur))}
                value={Math.floor(cur)}
                onChange={(e) => seekTo(parseInt(e.target.value, 10))}
                className="flex-1 min-w-0 accent-[#FBAE00] h-1.5"
                aria-label="Progreso"
              />
              <span className="shrink-0 text-[10px] font-mono text-gray-400 tabular-nums">
                {fmtTime(cur)} / {fmtTime(dur)}
              </span>
              <button
                onClick={() => setShowVideo((v) => !v)}
                className={`shrink-0 p-1.5 rounded-md ${showVideo ? 'text-primary' : 'text-gray-500'} active:text-white`}
                title="Mostrar / ocultar video"
                aria-label="Mostrar video"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default SingerView;
