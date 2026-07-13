import { useState, useEffect, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Datos para las vistas del EQUIPO (Cantantes / Producción) — optimizado para
// gente no técnica con el teléfono en la mano:
//   · Pinta AL INSTANTE desde caché (localStorage) y refresca en background.
//   · Vuelve a refrescar al volver a la app / recuperar internet (si pasó
//     más de 1 min) — el domingo la lista nueva aparece sola.
//   · Sin internet: se queda con la última copia buena (letra disponible
//     aunque la señal en el templo sea mala).
// ─────────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'gis.team.cache.v1';
const STALE_MS = 60_000;

export const useTeamData = (apiUrl) => {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastFetch = useRef(0);

  // Caché primero: la lista aparece al instante en visitas repetidas.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (Array.isArray(c.songs) && c.songs.length) {
          setSongs(c.songs);
          setSetlists(Array.isArray(c.setlists) ? c.setlists : []);
          setLoading(false);
        }
      }
    } catch (e) {
      /* caché corrupta: se ignora */
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [sr, lr] = await Promise.all([
        fetch(`${apiUrl}/songs`),
        fetch(`${apiUrl}/setlists`),
      ]);
      if (!sr.ok || !lr.ok) throw new Error('respuesta no válida');
      const s = await sr.json();
      const l = await lr.json();
      const freshSongs = Array.isArray(s) ? s.map((x) => ({ ...x, id: x._id })) : [];
      const freshSetlists = Array.isArray(l) ? l.map((x) => ({ ...x, id: x._id })) : [];
      setSongs(freshSongs);
      setSetlists(freshSetlists);
      lastFetch.current = Date.now();
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ songs: freshSongs, setlists: freshSetlists, at: Date.now() })
        );
      } catch (e) {
        /* storage lleno: seguimos sin caché */
      }
    } catch (e) {
      /* offline / error: nos quedamos con lo que haya (caché) */
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresca al VOLVER a la app o recuperar red (si los datos están viejos).
  useEffect(() => {
    const maybeRefresh = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch.current > STALE_MS) {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', maybeRefresh);
    window.addEventListener('focus', maybeRefresh);
    window.addEventListener('online', refresh);
    return () => {
      document.removeEventListener('visibilitychange', maybeRefresh);
      window.removeEventListener('focus', maybeRefresh);
      window.removeEventListener('online', refresh);
    };
  }, [refresh]);

  return { songs, setlists, loading, refresh };
};

// ── Utilidades de setlists para el equipo ──────────────────────────────────

const dayKey = (d) => {
  const dt = d instanceof Date ? d : new Date(String(d));
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const isSetlistToday = (sl) => !!sl?.date && dayKey(sl.date) === dayKey(new Date());

// Orden pensado para el domingo: HOY primero, luego próximas fechas (la más
// cercana antes), luego pasadas (la más reciente antes) y al final las sin fecha.
export const orderSetlists = (setlists) => {
  const today = dayKey(new Date());
  const score = (sl) => {
    const k = sl.date ? dayKey(sl.date) : null;
    if (!k) return { g: 3, v: 0 };
    if (k === today) return { g: 0, v: 0 };
    if (k > today) return { g: 1, v: new Date(k).getTime() };
    return { g: 2, v: -new Date(k).getTime() };
  };
  return [...setlists].sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    return sa.g - sb.g || sa.v - sb.v;
  });
};
