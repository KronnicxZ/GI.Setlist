import { useMemo } from 'react';
import Fuse from 'fuse.js';

export const useSongFilters = (songs, selectedSetlist, searchTerm, genreFilter, sortBy) => {
  const contextSongs = useMemo(() => {
    if (!selectedSetlist) return songs;
    return selectedSetlist.songs
      .map((s) => {
        const sId = (s.id || s._id || s)?.toString();
        return songs.find((song) => {
          const songId = (song.id || song._id)?.toString();
          return songId === sId;
        });
      })
      .filter(Boolean);
  }, [songs, selectedSetlist]);

  // 1. Filtrar por género (memo aparte: no depende del término de búsqueda)
  const genreFiltered = useMemo(() => {
    const normalize = (text) =>
      text
        ?.toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
    return contextSongs.filter((song) => {
      return genreFilter === 'Todas' || normalize(song.genre) === normalize(genreFilter);
    });
  }, [contextSongs, genreFilter]);

  // Índice difuso construido UNA vez por lista (antes se reconstruía en cada
  // tecla: O(n) por carácter — el lag de tipeo que se sentía en móvil).
  const fuse = useMemo(
    () =>
      new Fuse(genreFiltered, {
        keys: ['title', 'artist', 'genre'],
        threshold: 0.4, // Ajuste de sensibilidad (0.0 = exacto, 1.0 = todo coincide)
        includeScore: true,
      }),
    [genreFiltered]
  );

  const filteredSongs = useMemo(() => {
    let list = genreFiltered;

    // 2. Aplicar Búsqueda Difusa (Fuzzy Search) si hay término
    if (searchTerm.trim()) {
      const results = fuse.search(searchTerm);
      list = results.map((r) => r.item);
    }

    // 3. Si no hay búsqueda por término, o si estamos en una lista, aplicar ordenamiento
    if (selectedSetlist && !searchTerm.trim()) return list;

    if (!searchTerm.trim()) {
      return [...list].sort((a, b) => {
        const compareStrings = (s1, s2) =>
          (s1 || '').toString().localeCompare((s2 || '').toString());
        switch (sortBy) {
          case 'title':
            return compareStrings(a.title, b.title);
          case 'artist':
            return compareStrings(a.artist, b.artist);
          case 'genre':
            return compareStrings(a.genre, b.genre);
          case 'bpm':
            return (parseInt(a.bpm) || 0) - (parseInt(b.bpm) || 0);
          case 'key':
            return compareStrings(a.key, b.key);
          default:
            return (b._id || b.id || '').toString().localeCompare((a._id || a.id || '').toString());
        }
      });
    }

    return list;
  }, [genreFiltered, fuse, searchTerm, sortBy, selectedSetlist]);

  return { contextSongs, filteredSongs };
};
