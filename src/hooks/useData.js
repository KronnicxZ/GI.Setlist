import { useState, useEffect, useCallback } from 'react';

export const useData = (apiUrl) => {
  const [songs, setSongs] = useState([]);
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [songsRes, setlistsRes] = await Promise.all([
        fetch(`${apiUrl}/songs`),
        fetch(`${apiUrl}/setlists`)
      ]);

      if (!songsRes.ok || !setlistsRes.ok) throw new Error('Error en la respuesta del servidor');

      const songsData = await songsRes.json();
      const setlistsData = await setlistsRes.json();

      if (Array.isArray(songsData)) {
        setSongs(songsData.map(s => ({ ...s, id: s._id })));
      }
      if (Array.isArray(setlistsData)) {
        setSetlists(setlistsData.map(s => ({ ...s, id: s._id })));
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

  const saveSong = async (songData, editingId = null) => {
    const url = editingId ? `${apiUrl}/songs/${editingId}` : `${apiUrl}/songs`;
    const method = editingId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songData)
    });
    const savedSong = await response.json();
    const formattedSong = { ...savedSong, id: savedSong._id };
    
    if (editingId) {
      setSongs(prev => prev.map(s => s.id === editingId ? formattedSong : s));
    } else {
      setSongs(prev => [...prev, formattedSong]);
    }
    return formattedSong;
  };

  const deleteSong = async (idOrIds) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    for (const id of ids) {
      await fetch(`${apiUrl}/songs/${id}`, { method: 'DELETE' });
    }
    setSongs(prev => prev.filter(s => !ids.includes(s.id)));
  };

  const saveSetlist = async (setlistData, editingId = null) => {
    const url = editingId ? `${apiUrl}/setlists/${editingId}` : `${apiUrl}/setlists`;
    const method = editingId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setlistData)
    });
    const savedSetlist = await response.json();
    const formattedSetlist = { ...savedSetlist, id: savedSetlist._id };
    
    if (editingId) {
      setSetlists(prev => prev.map(s => s.id === editingId ? formattedSetlist : s));
    } else {
      setSetlists(prev => [...prev, formattedSetlist]);
    }
    return formattedSetlist;
  };

  const deleteSetlist = async (id) => {
    await fetch(`${apiUrl}/setlists/${id}`, { method: 'DELETE' });
    setSetlists(prev => prev.filter(s => s.id !== id));
  };

  const addToSetlist = async (songIdOrIds, setlistId) => {
    const idsToAdd = Array.isArray(songIdOrIds) ? songIdOrIds : [songIdOrIds];
    const setlist = setlists.find(l => l.id === setlistId);
    if (!setlist) return;

    const existingIds = setlist.songs.map(s => s.id || s._id || (typeof s === 'string' ? s : null)).filter(Boolean);
    const uniqueNewIds = idsToAdd.filter(id => !existingIds.includes(id));
    if (uniqueNewIds.length === 0) return;

    const allNewSongIds = [...existingIds, ...uniqueNewIds];
    const response = await fetch(`${apiUrl}/setlists/${setlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs: allNewSongIds })
    });

    if (!response.ok) throw new Error('Error al actualizar setlist');
    
    const updatedRaw = await response.json();
    const populatedSongs = allNewSongIds.map(id => songs.find(s => s.id === id || s._id === id)).filter(Boolean);
    const updated = { ...updatedRaw, id: updatedRaw._id, songs: populatedSongs };
    
    setSetlists(prev => prev.map(s => s.id === setlistId ? updated : s));
    return updated;
  };

  const removeFromSetlist = async (idOrIds, setlistId) => {
    const idsToRemove = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const setlist = setlists.find(l => l.id === setlistId);
    if (!setlist) return;

    const remainingSongs = setlist.songs.filter(s => !idsToRemove.includes(s.id || s._id || s));
    const remainingIds = remainingSongs.map(s => s.id || s._id || s);

    const response = await fetch(`${apiUrl}/setlists/${setlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs: remainingIds })
    });

    if (!response.ok) throw new Error('Error al quitar canciones');
    
    const updatedRaw = await response.json();
    const updated = { ...updatedRaw, id: updatedRaw._id, songs: remainingSongs };
    
    setSetlists(prev => prev.map(s => s.id === setlistId ? updated : s));
    return updated;
  };

  return {
    songs, setSongs,
    setlists, setSetlists,
    loading,
    saveSong, deleteSong,
    saveSetlist, deleteSetlist,
    addToSetlist, removeFromSetlist,
    fetchData
  };
};
