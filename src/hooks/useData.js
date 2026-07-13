import { useState, useEffect, useCallback } from 'react';
import { authHeaders, adminAuthHeaders } from '../utils/api';

export const useData = (apiUrl) => {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [songsRes, setlistsRes] = await Promise.all([
        fetch(`${apiUrl}/songs`),
        fetch(`${apiUrl}/setlists`),
      ]);

      if (!songsRes.ok || !setlistsRes.ok) throw new Error('Error en la respuesta del servidor');

      const songsData = await songsRes.json();
      const setlistsData = await setlistsRes.json();

      if (Array.isArray(songsData)) {
        setSongs(songsData.map((s) => ({ ...s, id: s._id })));
      }
      if (Array.isArray(setlistsData)) {
        setSetlists(setlistsData.map((s) => ({ ...s, id: s._id })));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setSongs([]);
      setSetlists([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mutadores estabilizados con useCallback: sin esto se recreaban en cada
  // render de App y rompían el memo() de SongList/SongCard (toda la lista se
  // re-renderizaba al tipear en el buscador).
  const saveSong = useCallback(
    async (songData, editingId = null) => {
    const url = editingId ? `${apiUrl}/songs/${editingId}` : `${apiUrl}/songs`;
    const method = editingId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(songData),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({}))).error || 'No se pudo guardar la canción'
      );
    const savedSong = await response.json();
    const formattedSong = { ...savedSong, id: savedSong._id };

    if (editingId) {
      setSongs((prev) => prev.map((s) => (s.id === editingId ? formattedSong : s)));
    } else {
      setSongs((prev) => [...prev, formattedSong]);
    }
    return formattedSong;
    },
    [apiUrl]
  );

  const deleteSong = useCallback(
    async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    for (const id of ids) {
      const res = await fetch(`${apiUrl}/songs/${id}`, {
        method: 'DELETE',
        headers: adminAuthHeaders(),
      });
      if (!res.ok) throw new Error('No se pudo eliminar la canción');
    }
    setSongs((prev) => prev.filter((s) => !ids.includes(s.id)));
    },
    [apiUrl]
  );

  const saveSetlist = useCallback(
    async (setlistData, editingId = null) => {
    const url = editingId ? `${apiUrl}/setlists/${editingId}` : `${apiUrl}/setlists`;
    const method = editingId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(setlistData),
    });
    if (!response.ok)
      throw new Error(
        (await response.json().catch(() => ({}))).error || 'No se pudo guardar el setlist'
      );
    const savedSetlist = await response.json();
    const formattedSetlist = { ...savedSetlist, id: savedSetlist._id };

    if (editingId) {
      setSetlists((prev) => prev.map((s) => (s.id === editingId ? formattedSetlist : s)));
    } else {
      setSetlists((prev) => [...prev, formattedSetlist]);
    }
    return formattedSetlist;
    },
    [apiUrl]
  );

  const deleteSetlist = useCallback(
    async (id) => {
    const res = await fetch(`${apiUrl}/setlists/${id}`, {
      method: 'DELETE',
      headers: adminAuthHeaders(),
    });
    if (!res.ok) throw new Error('No se pudo eliminar el setlist');
    setSetlists((prev) => prev.filter((s) => s.id !== id));
    },
    [apiUrl]
  );

  const addToSetlist = useCallback(
    async (songIdOrIds, setlistId) => {
    const idsToAdd = Array.isArray(songIdOrIds) ? songIdOrIds : [songIdOrIds];
    const setlist = setlists.find((l) => l.id === setlistId);
    if (!setlist) return;

    const existingIds = setlist.songs
      .map((s) => s.id || s._id || (typeof s === 'string' ? s : null))
      .filter(Boolean);
    const uniqueNewIds = idsToAdd.filter((id) => !existingIds.includes(id));
    if (uniqueNewIds.length === 0) return;

    const allNewSongIds = [...existingIds, ...uniqueNewIds];
    const response = await fetch(`${apiUrl}/setlists/${setlistId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ songs: allNewSongIds }),
    });

    if (!response.ok) throw new Error('Error al actualizar setlist');

    const updatedRaw = await response.json();
    const populatedSongs = allNewSongIds
      .map((id) => songs.find((s) => s.id === id || s._id === id))
      .filter(Boolean);
    const updated = { ...updatedRaw, id: updatedRaw._id, songs: populatedSongs };

    setSetlists((prev) => prev.map((s) => (s.id === setlistId ? updated : s)));
    return updated;
    },
    [apiUrl, setlists, songs]
  );

  const removeFromSetlist = useCallback(
    async (idOrIds, setlistId) => {
    const idsToRemove = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const setlist = setlists.find((l) => l.id === setlistId);
    if (!setlist) return;

    const remainingSongs = setlist.songs.filter((s) => !idsToRemove.includes(s.id || s._id || s));
    const remainingIds = remainingSongs.map((s) => s.id || s._id || s);

    const response = await fetch(`${apiUrl}/setlists/${setlistId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ songs: remainingIds }),
    });

    if (!response.ok) throw new Error('Error al quitar canciones');

    const updatedRaw = await response.json();
    const updated = { ...updatedRaw, id: updatedRaw._id, songs: remainingSongs };

    setSetlists((prev) => prev.map((s) => (s.id === setlistId ? updated : s)));
    return updated;
    },
    [apiUrl, setlists]
  );

  return {
    songs,
    setSongs,
    setlists,
    setSetlists,
    loading,
    saveSong,
    deleteSong,
    saveSetlist,
    deleteSetlist,
    addToSetlist,
    removeFromSetlist,
    fetchData,
  };
};
