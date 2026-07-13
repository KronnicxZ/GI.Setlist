import React, { useState, useEffect, useRef, useMemo } from 'react';
import parse from 'html-react-parser';
import { transposeText, formatLyricsForDisplay, NOTES } from '../utils/chordTransposer';
import { cleanLyricsForProjection } from '../utils/projection';

// ─────────────────────────────────────────────────────────────────────────
// Vista CANTANTE — letra a pantalla completa estilo LivePads, ultra ligera:
//   · Barra superior: tono actual, transpose ▼0▲, zoom A−/A+, toggle acordes,
//     metrónomo compacto (Tone.js solo si se usa).
//   · La "canción" es un REPRODUCTOR compacto tipo MP3 (el iframe de YouTube
//     vive oculto en 1px y solo se controla por API) — nada de video ocupando
//     pantalla ni renderizado pesado. Botón para expandir el video si hace falta.
//   · Sin popovers de acordes ni BD de guitarra ni html2canvas: solo letra.
// Nota: transponer el AUDIO de YouTube no es posible en web (el iframe no
// expone el stream); el transpose aquí es de acordes/tono visual.
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

const SingerView = ({ song, videoId, onClose }) => {
  const [semitones, setSemitones] = useState(0);
  // Por defecto SOLO LETRA (lo que un cantante quiere leer); la elección se
  // recuerda para el que sí trabaja con acordes.
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

  // ── Reproductor (YouTube oculto, UI de MP3) ──
  const [player, setPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const tickRef = useRef(null);

  // ── Metrónomo compacto (Tone.js diferido) ──
  const [metroOn, setMetroOn] = useState(false);
  const toneRef = useRef(null);
  const synthRef = useRef(null);
  const repeatRef = useRef(null);

  useEffect(() => {
    document.title = `${song.title} — GI Cantantes`;
  }, [song.title]);

  // Pantalla SIEMPRE encendida mientras la letra está abierta (Wake Lock):
  // en escenario el teléfono no se puede apagar a mitad de canción. Se
  // re-solicita al volver a la pestaña (el lock se libera al ocultarla).
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

  // El botón ATRÁS del teléfono cierra la letra (no saca de la app) — el
  // gesto natural para alguien no técnico.
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
  const currentKey = useMemo(() => {
    const base = (song.key || song.originalKey || '').trim();
    if (!base) return '—';
    const isMinor = /m$/i.test(base) && !/maj/i.test(base);
    const root = base.replace(/m$/i, '');
    const idx = NOTES.indexOf(root.length > 1 ? root[0].toUpperCase() + root[1] : root.toUpperCase());
    if (idx === -1) return base;
    return NOTES[(idx + semitones + 120) % 12] + (isMinor ? 'm' : '');
  }, [song.key, song.originalKey, semitones]);

  // Letra memoizada (no se re-parsea por los ticks del reproductor).
  // CON acordes: transpone y muestra el cifrado encima de cada línea.
  // SOLO LETRA: pasa por el limpiador de proyección — las líneas de cifrado
  // desaparecen POR COMPLETO (no dejan huecos) y quedan las etiquetas [CORO]
  // como píldoras; texto compacto y fácil de leer.
  const renderedLyrics = useMemo(() => {
    if (!song.lyrics)
      return <p className="text-gray-600 italic">No hay letra disponible para esta canción.</p>;
    const source = showChords
      ? transposeText(song.lyrics, semitones)
      : cleanLyricsForProjection(song.lyrics, { keepSections: true });
    return parse(formatLyricsForDisplay(source));
  }, [song.lyrics, semitones, showChords]);

  // ── YouTube: player oculto controlado por API ──
  useEffect(() => {
    if (!videoId) return undefined;
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
            setPlayer(e.target);
            setDur(e.target.getDuration() || 0);
          },
          onStateChange: (e) => {
            setPlaying(e.data === 1);
            if (e.data === 1 && e.target.getDuration) setDur(e.target.getDuration() || 0);
          },
        },
      });
    };
    if (window.YT && window.YT.Player) create();
    else {
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

  // Tick de progreso (1/s, solo si cambia el segundo visible)
  useEffect(() => {
    if (playing && player) {
      tickRef.current = setInterval(() => {
        const t = player.getCurrentTime ? player.getCurrentTime() : 0;
        setCur((prev) => (Math.floor(prev) === Math.floor(t) ? prev : t));
      }, 500);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playing, player]);

  const togglePlay = () => {
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };
  const seekBy = (s) => {
    if (!player) return;
    const t = Math.max(0, (player.getCurrentTime() || 0) + s);
    player.seekTo(t, true);
    setCur(t);
  };
  const seekTo = (t) => {
    if (!player) return;
    player.seekTo(t, true);
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

  return (
    <div className="fixed inset-0 z-[150] bg-main text-white flex flex-col">
      {/* ── Barra superior estilo LivePads ── */}
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

          {/* Tono actual */}
          <span className="shrink-0 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-black text-sm">
            {currentKey}
          </span>

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
      <main className="flex-1 min-h-0 overflow-y-auto px-5 md:px-10 py-6 custom-scrollbar">
        <div
          className={`lyrics-view max-w-3xl mx-auto text-gray-200 ${showChords ? '' : 'no-chords'}`}
          style={{ fontSize: `${lyricSize}px` }}
        >
          {renderedLyrics}
        </div>
      </main>

      {/* ── Reproductor tipo MP3 ABAJO (como un player de música) ── */}
      {videoId && (
        <footer
          className="shrink-0 border-t border-white/5 bg-main/95 px-3 pt-2"
          style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Video expandible ENCIMA de la barra (opcional) */}
          <div
            className={
              showVideo
                ? 'mb-2 aspect-video w-full max-w-xl mx-auto rounded-lg overflow-hidden bg-black'
                : 'absolute w-px h-px overflow-hidden opacity-0 pointer-events-none'
            }
          >
            <div id="singer-audio-player" className="w-full h-full" />
          </div>
          <div className="max-w-3xl mx-auto">
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
                disabled={!player}
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
                <svg className="w-4.5 h-4.5 w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default SingerView;
