import React, { useState, useEffect } from 'react';
import SongList from './components/SongList';
import SearchBar from './components/SearchBar';
import SongForm from './components/SongForm';
import SetlistForm from './components/SetlistForm';
import SortFilter from './components/SortFilter';
import PlayerModal from './components/PlayerModal';
import LoginModal from './components/LoginModal';
import BibleVerse from './components/BibleVerse';
import ConfirmationModal from './components/ConfirmationModal';
import DuplicateModal from './components/DuplicateModal';
import AdminPanel from './components/AdminPanel';
import CustomAlert from './components/CustomAlert';
import { useAuth } from './context/AuthContext';
import { extractYoutubeVideoId, getVideoDuration } from './utils/youtube';

function App() {
  const [songs, setSongs] = useState([]);
  const [songDurations, setSongDurations] = useState({});
  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSongForm, setShowSongForm] = useState(false);
  const [showSetlistForm, setShowSetlistForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [editingSetlist, setEditingSetlist] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDeleteSetlistModalOpen, setIsDeleteSetlistModalOpen] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState(null);
  const [isDeleteSongModalOpen, setIsDeleteSongModalOpen] = useState(false);
  const [songToDeleteInfo, setSongToDeleteInfo] = useState(null); // { id, count }
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'setlists', 'search', 'admin'
  const [genreFilter, setGenreFilter] = useState('Todas'); // 'Todas', 'Alabanza', 'Adoración'
  const [songToDuplicate, setSongToDuplicate] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [restoreAlert, setRestoreAlert] = useState({ isOpen: false, file: null, event: null });
  const [successAlert, setSuccessAlert] = useState({ isOpen: false, message: '' });
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: '' });

  // Estado para el "Toque Secreto"
  const [logoClicks, setLogoClicks] = useState(0);

  const { isAdmin, logout } = useAuth();

  const API_URL = process.env.REACT_APP_API_URL ||
    ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api');

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching from API_URL:', API_URL);
      try {
        setLoading(true);
        const [songsRes, setlistsRes] = await Promise.all([
          fetch(`${API_URL}/songs`),
          fetch(`${API_URL}/setlists`)
        ]);

        if (!songsRes.ok || !setlistsRes.ok) {
          console.error('API Response not OK:', songsRes.status, setlistsRes.status);
          throw new Error('Error en la respuesta del servidor');
        }

        const songsData = await songsRes.json();
        const setlistsData = await setlistsRes.json();

        console.log('Fetched songs:', songsData.length);
        if (Array.isArray(songsData)) {
          setSongs(songsData.map(s => ({ ...s, id: s._id })));
        }
        if (Array.isArray(setlistsData)) {
          setSetlists(setlistsData.map(s => ({ ...s, id: s._id })));
        }
      } catch (error) {
        console.error('Error al cargar datos desde MongoDB:', error);
        setSongs([]);
        setSetlists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.setlist-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAllDurations = async () => {
      const durations = { ...songDurations };
      let changed = false;

      // Solo buscamos duraciones para canciones que No la tengan en BD
      for (const song of songs) {
        const sId = song.id || song._id;
        if (song.youtubeUrl && !song.duration && !durations[sId]) {
          const videoId = extractYoutubeVideoId(song.youtubeUrl);
          if (videoId) {
            try {
              const duration = await getVideoDuration(videoId);
              if (duration !== '-') {
                durations[sId] = duration;
                changed = true;
              }
            } catch (e) {
              console.error('Error fetching duration for', song.title);
            }
          }
        }
      }
      if (changed) setSongDurations(durations);
    };

    if (songs.length > 0) fetchAllDurations();
  }, [songs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lógica del Toque Secreto: 5 clics en 2 segundos
  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
  };

  useEffect(() => {
    if (logoClicks >= 5) {
      setShowLoginModal(true);
      setLogoClicks(0);
    }
    const timer = setTimeout(() => setLogoClicks(0), 3000); // Reset cada 3 seg
    return () => clearTimeout(timer);
  }, [logoClicks]);

  const filteredSongs = React.useMemo(() => {
    const list = (selectedSetlist
      ? songs.filter(song => selectedSetlist.songs.some(s => {
        const sId = s.id || s._id || s;
        return sId === song.id || sId === song._id;
      }))
      : songs
    ).filter(song => {
      // Aplicar búsqueda por texto
      const title = song.title || '';
      const artist = song.artist || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.toLowerCase().includes(searchTerm.toLowerCase());

      // Helper para normalizar texto (quitar acentos)
      const normalize = (text) =>
        text?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Aplicar filtro de género (normalizado para ignorar acentos y mayúsculas)
      const matchesGenre = genreFilter === 'Todas' ||
        normalize(song.genre) === normalize(genreFilter);

      return matchesSearch && matchesGenre;
    });

    return list.sort((a, b) => {
      // Helper para comparar strings de forma segura
      const compareStrings = (s1, s2) => (s1 || '').toString().localeCompare((s2 || '').toString());

      switch (sortBy) {
        case 'title':
          return compareStrings(a.title, b.title);
        case 'artist':
          return compareStrings(a.artist, b.artist);
        case 'genre':
          return compareStrings(a.genre, b.genre);
        case 'bpm':
          const bpmA = parseInt(a.bpm) || 0;
          const bpmB = parseInt(b.bpm) || 0;
          return bpmA - bpmB;
        case 'key':
          return compareStrings(a.key, b.key);
        case 'duration':
          const getSecs = (song) => {
            const d = song.duration || songDurations[song.id || song._id];
            if (!d || !d.includes(':')) return 0;
            const [m, s] = d.split(':').map(Number);
            return (m * 60) + (s || 0);
          };
          return getSecs(a) - getSecs(b);
        default: // 'Recientes' o cualquier otro
          // Orden inverso por ID (MongoDB IDs son cronológicos)
          const idA = a._id || a.id || '';
          const idB = b._id || b.id || '';
          return idB.toString().localeCompare(idA.toString());
      }
    });
  }, [songs, selectedSetlist, searchTerm, genreFilter, sortBy, songDurations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Conectando con la biblioteca...</p>
        </div>
      </div>
    );
  }


  const getTotalDuration = () => {
    if (!selectedSetlist) return null;
    let totalSeconds = 0;

    // Usamos filteredSongs que ya tiene las canciones del setlist
    filteredSongs.forEach(song => {
      const sId = song.id || song._id;
      // Preferimos la duración guardada en DB, si no, la automática de YouTube
      const durationStr = song.duration || songDurations[sId];

      if (durationStr && durationStr.includes(':')) {
        const parts = durationStr.split(':');
        if (parts.length === 2) {
          const [min, sec] = parts.map(Number);
          totalSeconds += (min * 60) + (sec || 0);
        }
      }
    });

    if (totalSeconds === 0) return null;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min${seconds > 0 ? ` ${seconds}s` : ''}`;
  };

  const handleSaveSong = async (songData) => {
    try {
      const url = editingSong ? `${API_URL}/songs/${editingSong.id}` : `${API_URL}/songs`;
      const method = editingSong ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(songData)
      });
      const savedSong = await response.json();
      if (editingSong) {
        setSongs(songs.map(s => s.id === editingSong.id ? { ...savedSong, id: savedSong._id } : s));
      } else {
        setSongs([...songs, { ...savedSong, id: savedSong._id }]);
      }
      setShowSongForm(false);
      setEditingSong(null);
    } catch (error) {
      console.error('Error al guardar canción:', error);
    }
  };

  const handleDuplicateSong = (song) => {
    setSongToDuplicate(song);
  };

  const handleConfirmDuplicate = async (duplicatedData) => {
    try {
      const response = await fetch(`${API_URL}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedData)
      });

      const savedSong = await response.json();
      setSongs([...songs, { ...savedSong, id: savedSong._id }]);
      setSongToDuplicate(null);
    } catch (error) {
      console.error('Error al duplicar canción:', error);
    }
  };

  const handleSaveSetlist = async (setlistData) => {
    try {
      const url = editingSetlist ? `${API_URL}/setlists/${editingSetlist.id}` : `${API_URL}/setlists`;
      const method = editingSetlist ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setlistData)
      });
      const savedSetlist = await response.json();
      if (editingSetlist) {
        setSetlists(setlists.map(s => s.id === editingSetlist.id ? { ...savedSetlist, id: savedSetlist._id } : s));
      } else {
        setSetlists([...setlists, { ...savedSetlist, id: savedSetlist._id }]);
      }
      setShowSetlistForm(false);
      setEditingSetlist(null);
    } catch (error) {
      console.error('Error al guardar setlist:', error);
    }
  };

  const handleDeleteSong = (idOrIds, callback) => {
    if (Array.isArray(idOrIds)) {
      setSongToDeleteInfo({ ids: idOrIds, count: idOrIds.length, onSuccess: callback });
    } else {
      setSongToDeleteInfo({ id: idOrIds, count: 1, onSuccess: callback });
    }
    setIsDeleteSongModalOpen(true);
  };

  const handleConfirmDeleteSong = async () => {
    if (!songToDeleteInfo) return;
    try {
      if (songToDeleteInfo.ids) {
        // Eliminar múltiples
        for (const id of songToDeleteInfo.ids) {
          await fetch(`${API_URL}/songs/${id}`, { method: 'DELETE' });
        }
        setSongs(songs.filter(s => !songToDeleteInfo.ids.includes(s.id)));
      } else {
        // Eliminar una
        await fetch(`${API_URL}/songs/${songToDeleteInfo.id}`, { method: 'DELETE' });
        setSongs(songs.filter(s => s.id !== songToDeleteInfo.id));
      }
      if (songToDeleteInfo.onSuccess) songToDeleteInfo.onSuccess();
    } catch (error) {
      console.error('Error al eliminar canción:', error);
    } finally {
      setIsDeleteSongModalOpen(false);
      setSongToDeleteInfo(null);
    }
  };

  const handleRemoveFromSetlist = async (idOrIds, callback) => {
    if (!selectedSetlist) return;
    try {
      const idsToRemove = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      const updatedSongs = selectedSetlist.songs.filter(s => {
        const sId = s.id || s._id || s;
        return !idsToRemove.includes(sId);
      });

      const response = await fetch(`${API_URL}/setlists/${selectedSetlist.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedSetlist, songs: updatedSongs })
      });

      const updatedSetlist = await response.json();
      setSetlists(setlists.map(s => s.id === selectedSetlist.id ? { ...updatedSetlist, id: updatedSetlist._id } : s));
      setSelectedSetlist({ ...updatedSetlist, id: updatedSetlist._id });
      if (callback) callback();
    } catch (error) {
      console.error('Error al quitar canción del setlist:', error);
    }
  };

  const handleDeleteSetlist = async (id) => {
    setSetlistToDelete(id);
    setIsDeleteSetlistModalOpen(true);
  };

  const handleConfirmDeleteSetlist = async () => {
    if (!setlistToDelete) return;
    try {
      await fetch(`${API_URL}/setlists/${setlistToDelete}`, { method: 'DELETE' });
      setSetlists(setlists.filter(s => s.id !== setlistToDelete));
      if (selectedSetlist?.id === setlistToDelete) setSelectedSetlist(null);
    } catch (error) {
      console.error('Error al eliminar setlist:', error);
    } finally {
      setIsDeleteSetlistModalOpen(false);
      setSetlistToDelete(null);
    }
  };

  const handleAddToSetlist = async (setlistId, songId) => {
    try {
      const setlist = setlists.find(l => l.id === setlistId);
      const newSongs = [...setlist.songs, songId];
      const response = await fetch(`${API_URL}/setlists/${setlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs: newSongs })
      });
      const updatedSetlist = await response.json();
      setSetlists(setlists.map(s => s.id === setlistId ? { ...updatedSetlist, id: updatedSetlist._id } : s));
    } catch (error) {
      console.error('Error al agregar al setlist:', error);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch(`${API_URL}/backup`);
      const backupData = await response.json();

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gi-setlist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error en backup:', error);
      setErrorAlert({ isOpen: true, message: 'Error al generar la copia de seguridad' });
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setRestoreAlert({ isOpen: true, file, event });
  };

  const confirmRestore = async () => {
    const { file, event } = restoreAlert;
    setRestoreAlert({ isOpen: false, file: null, event: null });

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const response = await fetch(`${API_URL}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });

      if (response.ok) {
        setSuccessAlert({ isOpen: true, message: 'Base de datos restaurada correctamente. La página se recargará.' });

        setTimeout(async () => {
          if ('serviceWorker' in navigator && 'caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          window.location.reload(true);
        }, 2000);
      } else {
        let errorMsg = 'Error desconocido';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || response.statusText;
        } catch (e) {
          errorMsg = response.statusText;
        }
        setErrorAlert({ isOpen: true, message: `Error al restaurar: ${errorMsg}` });
      }
    } catch (error) {
      console.error('Error al restaurar:', error);
      setErrorAlert({
        isOpen: true,
        message: `Error de red o de archivo: ${error.message || 'No se pudo conectar con el servidor'}`
      });
    } finally {
      if (restoreAlert.event && restoreAlert.event.target) {
        restoreAlert.event.target.value = '';
      }
    }
  };

  return (
    <>
      {/* Eliminamos el loader de pantalla completa para dejar paso a los skeletons */}

      <div className="flex flex-col md:flex-row h-screen w-full bg-main text-white md:gap-4 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className={`hidden md:flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }}
            className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-12 bg-surface border-y border-r border-white/10 rounded-r-lg flex items-center justify-center text-primary hover:text-white hover:border-primary/50 transition-all z-[60]"
          >
            <svg className={`w-3.5 h-3.5 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24">
              <path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
          </button>

          <div className={`h-full bg-sidebar border-r border-white/5 overflow-y-auto overflow-x-hidden custom-scrollbar ${isSidebarCollapsed ? 'cursor-pointer' : ''}`} onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}>
            <div className="flex flex-col min-h-full p-4">
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} mb-10`}>
                {/* LOGO CON TOQUE SECRETO */}
                <div
                  className="flex items-center space-x-3 group min-w-0 cursor-pointer active:scale-95 transition-transform"
                  onClick={handleLogoClick}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-sub flex-shrink-0 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                    <img src="/favicon.png" alt="GI Logo" className="w-6 h-6" />
                  </div>
                  {!isSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-white truncate animate-fade-in">GI <span className="text-primary">Setlist</span></span>}
                </div>
              </div>

              <nav className="flex-1 space-y-8">
                {isAdmin && (
                  <div>
                    {!isSidebarCollapsed && <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-4">Acciones</h2>}
                    <div className="space-y-1">
                      <button onClick={() => { setEditingSong(null); setShowSongForm(true); }} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub hover:bg-white/[0.03]'} text-gray-400 hover:text-primary w-full transition-all group`} title={isSidebarCollapsed ? "Nueva canción" : ""}>
                        <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg></div>
                        {!isSidebarCollapsed && <span className="font-medium">Nueva canción</span>}
                      </button>
                      <button onClick={() => { setEditingSetlist(null); setShowSetlistForm(true); }} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub hover:bg-white/[0.03]'} text-gray-400 hover:text-primary w-full transition-all group`} title={isSidebarCollapsed ? "Nuevo setlist" : ""}>
                        <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg></div>
                        {!isSidebarCollapsed && <span className="font-medium">Nuevo setlist</span>}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  {!isSidebarCollapsed && <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-4">Mis Setlists</h2>}
                  <div className="space-y-1">
                    <div onClick={() => setSelectedSetlist(null)} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub'} cursor-pointer transition-all ${isSidebarCollapsed ? (!selectedSetlist ? 'text-primary' : 'text-gray-400 hover:text-white') : (!selectedSetlist ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white')}`} title={isSidebarCollapsed ? "Biblioteca Global" : ""}>
                      <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex-shrink-0 flex items-center justify-center ${!selectedSetlist ? 'bg-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-white/5'}`}><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg></div>
                      {!isSidebarCollapsed && <span className="font-medium text-sm">Biblioteca Global</span>}
                    </div>
                    {setlists.map((setlist) => (
                      <div key={setlist.id} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'justify-between px-4 py-2 rounded-sub'} group transition-all ${isSidebarCollapsed ? (selectedSetlist?.id === setlist.id ? 'text-primary' : 'text-gray-400 hover:text-white') : (selectedSetlist?.id === setlist.id ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white')} cursor-pointer`} title={isSidebarCollapsed ? setlist.name : ""} onClick={() => setSelectedSetlist(setlist)}>
                        <div className={`flex items-center ${isSidebarCollapsed ? '' : 'space-x-3'} flex-1 min-w-0`}>
                          <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex-shrink-0 flex items-center justify-center ${selectedSetlist?.id === setlist.id ? 'bg-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-white/5'}`}><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg></div>
                          {!isSidebarCollapsed && (
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm truncate">{setlist.name}</span>
                              {setlist.date && (
                                <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                                  {new Date(setlist.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1 setlist-menu-container">
                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); setEditingSetlist(setlist); setShowSetlistForm(true); }} className="p-1 hover:text-primary rounded-lg hover:bg-white/5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg></button>}
                            <div className="relative">
                              <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === setlist.id ? null : setlist.id); }} className="p-1 hover:text-white rounded-lg hover:bg-white/5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" /></svg></button>
                              {openMenuId === setlist.id && <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-white/10 rounded-sub shadow-2xl py-1 z-50 overflow-hidden animate-fade-in glass">{isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(setlist.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 font-medium">Eliminar</button>}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </nav>

              <BibleVerse isCollapsed={isSidebarCollapsed} />

              <div className="mt-8 pt-6 border-t border-white/5">
                {isAdmin && (
                  <button onClick={() => setShowAdminPanel(true)} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub hover:bg-white/[0.03]'} text-gray-400 hover:text-primary w-full transition-all group`} title={isSidebarCollapsed ? "Panel de Admin" : ""}>
                    <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg></div>
                    {!isSidebarCollapsed && <span className="font-medium">Panel de Admin</span>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col h-full relative overflow-hidden ${selectedSong ? 'hidden md:flex' : 'flex'}`}>

          {/* Desktop Header */}
          <header className="hidden md:block sticky top-0 z-40 px-8 py-6 bg-main/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-[1800px] mx-auto flex justify-between items-center gap-6">
              <div>
                <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{selectedSetlist ? 'Colección' : 'Música'}</div>
                <div className="flex items-baseline space-x-4">
                  <h1 className="text-4xl font-extrabold tracking-tight">{selectedSetlist ? selectedSetlist.name : 'Biblioteca'}</h1>
                  <div className="flex items-center space-x-3">
                    {selectedSetlist?.date && (
                      <span className="text-sm font-bold text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                        {new Date(selectedSetlist.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    )}
                    {selectedSetlist && (
                      <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/10 flex items-center space-x-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" /></svg>
                        <span>{getTotalDuration() || '--:--'}</span>
                      </span>
                    )}
                    {selectedSetlist && (
                      <span className="text-sm font-bold text-gray-500 px-2 uppercase tracking-widest">{filteredSongs.length} temas</span>
                    )}
                    {selectedSetlist && <button onClick={() => setSelectedSetlist(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg></button>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
                <div className="flex-1"><SearchBar value={searchTerm} onSearch={setSearchTerm} /></div>
                <div className="min-w-[160px]"><SortFilter onSortChange={setSortBy} /></div>
                {isAdmin && <button onClick={() => { setEditingSong(null); setShowSongForm(true); }} className="bg-primary text-black h-[42px] px-6 rounded-sub font-bold flex items-center justify-center space-x-2 hover:bg-primary-hover shadow-lg active:scale-95 transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg><span>Nueva</span></button>}
              </div>
            </div>
          </header>

          {/* Mobile Header (Consolidated) */}
          <div className="md:hidden sticky top-0 z-50 bg-main/80 backdrop-blur-xl border-b border-white/5 pt-4 pb-2 px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-10 h-10 bg-[#161616] rounded-xl flex items-center justify-center border border-primary/20 active:bg-primary/30 transition-colors shadow-lg"
                  onClick={handleLogoClick}
                >
                  <img src="/favicon.png" alt="Logo" className="w-6 h-6" />
                </div>
                <div className="flex items-center">
                  <h1 className="text-xl font-black tracking-tighter flex items-center">
                    <span className="text-white">GI</span>
                    <span className="text-primary ml-1.5 line-clamp-1">{activeTab === 'admin' ? 'Perfil' : activeTab === 'setlists' ? 'Setlists' : activeTab === 'search' ? 'Buscador' : (selectedSetlist ? selectedSetlist.name : 'Setlist')}</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activeTab === 'search' && (
                  <button onClick={() => { setActiveTab('library'); setSearchTerm(''); }} className="p-2 text-primary" title="Volver a la biblioteca">
                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
                  </button>
                )}
                {isAdmin && (activeTab === 'library' || activeTab === 'setlists') && (
                  <button
                    onClick={() => {
                      if (activeTab === 'library') { setEditingSong(null); setShowSongForm(true); }
                      else { setEditingSetlist(null); setShowSetlistForm(true); }
                    }}
                    className="w-8 h-8 bg-primary text-black rounded-lg flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Genre Tabs Filter - Moved into fixed header for mobile */}
            {(activeTab === 'library' || activeTab === 'search') && (
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
                {['Todas', 'Alabanza', 'Adoración'].map(genre => {
                  const normalize = (text) => text?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const count = genre === 'Todas' ? songs.length : songs.filter(s => normalize(s.genre) === normalize(genre)).length;
                  return (
                    <button
                      key={genre}
                      onClick={() => setGenreFilter(genre)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${genreFilter === genre ? 'bg-primary text-black border-primary' : 'text-gray-400 border-white/5 bg-white/5'}`}
                    >
                      {genre} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="pb-2 animate-fade-in"><SearchBar value={searchTerm} onSearch={setSearchTerm} /></div>
            )}
          </div>

          {/* Genre Tabs Filter (Desktop Only now) */}
          <div className="hidden md:block px-8 mt-4 no-print">
            <div className="max-w-[1800px] mx-auto flex items-center space-x-2 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
              {['Todas', 'Alabanza', 'Adoración'].map(genre => {
                const normalize = (text) => text?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const count = genre === 'Todas' ? songs.length : songs.filter(s => normalize(s.genre) === normalize(genre)).length;
                return (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genre)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${genreFilter === genre ? 'bg-primary text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {genre} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Screens Container */}
          <main className="flex-1 w-full max-w-[1800px] mx-auto overflow-y-auto overflow-x-hidden pt-2 md:pt-8 px-4 md:px-8 custom-scrollbar pb-32 md:pb-8">

            {/* Mobile Tab: Library/Search (Hybrid) */}
            <div className={`${activeTab === 'library' || activeTab === 'search' || !selectedSong ? '' : 'hidden md:block'} animate-fade-in`}>



              {(activeTab === 'library' || activeTab === 'search') && (
                <SongList
                  songs={filteredSongs}
                  onSongSelect={setSelectedSong}
                  onEditSong={isAdmin ? (song) => { setEditingSong(song); setShowSongForm(true); } : null}
                  onDeleteSong={isAdmin ? (selectedSetlist ? handleRemoveFromSetlist : handleDeleteSong) : null}
                  onDuplicateSong={isAdmin ? handleDuplicateSong : null}
                  setlists={isAdmin ? setlists : null}
                  onAddToSetlist={handleAddToSetlist}
                  isMobile={true}
                  isRemovingFromSetlist={!!selectedSetlist}
                  externalDurations={songDurations}
                  loading={loading}
                  onClearFilters={() => { setSearchTerm(''); setGenreFilter('Todas'); }}
                />
              )}
            </div>

            <div className={`${activeTab === 'setlists' ? 'block' : 'hidden'} md:hidden animate-fade-in pb-10`}>

              <div className="space-y-4">
                <div onClick={() => { setSelectedSetlist(null); setActiveTab('library'); }} className={`p-5 rounded-sub flex items-center justify-between transition-all ${!selectedSetlist ? 'bg-primary/10 border-2 border-primary/20' : 'bg-white/5 border border-white/5'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-sub flex items-center justify-center text-primary"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg></div>
                    <div>
                      <div className="font-bold text-lg">Biblioteca Global</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">{songs.length} temas</div>
                    </div>
                  </div>
                  {!selectedSetlist && <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                </div>

                {setlists.map(setlist => (
                  <div key={setlist.id} onClick={() => { setSelectedSetlist(setlist); setActiveTab('library'); }} className={`p-5 rounded-sub flex items-center justify-between transition-all ${selectedSetlist?.id === setlist.id ? 'bg-primary/10 border-2 border-primary/20' : 'bg-white/5 border border-white/5'}`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/5 rounded-sub flex items-center justify-center text-gray-400 group-active:text-primary"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg></div>
                      <div>
                        <div className="font-bold text-lg">{setlist.name}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{setlist.songs.length} temas</div>
                      </div>
                    </div>
                    {selectedSetlist?.id === setlist.id && <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                  </div>
                ))}

                {isAdmin && (
                  <button onClick={() => { setEditingSetlist(null); setShowSetlistForm(true); }} className="w-full p-5 rounded-sub border-2 border-dashed border-white/10 flex items-center justify-center space-x-3 text-gray-500 active:bg-white/5 active:border-white/20 transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    <span className="font-bold uppercase tracking-wider text-sm">Nuevo Setlist</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Tab: Perfil Screen (SOLO LOGOUT SI ES ADMIN) */}
            <div className={`${activeTab === 'admin' ? 'block' : 'hidden'} md:hidden animate-fade-in text-center pt-10`}>
              <div className="w-24 h-24 bg-primary/10 rounded-main mx-auto flex items-center justify-center border border-primary/20 mb-6">
                <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>

              <p className="text-muted mb-10 text-sm">{isAdmin ? 'Tienes acceso total a la biblioteca' : 'Explora la biblioteca de música'}</p>

              <div className="space-y-4 px-6">
                {isAdmin && (
                  <>
                    <button onClick={handleBackup} className="w-full p-4 bg-primary/10 text-primary rounded-sub font-bold flex items-center justify-center space-x-2 border border-primary/20 active:bg-primary/20">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                      </svg>
                      <span>Respaldar Datos</span>
                    </button>

                    <label className="w-full p-4 bg-blue-500/10 text-blue-400 rounded-sub font-bold flex items-center justify-center space-x-2 border border-blue-500/20 active:bg-blue-500/20 cursor-pointer">
                      <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M5,20H19V18H5M5,10H9V16H15V10H19L12,3L5,10Z" />
                      </svg>
                      <span>Restaurar Copia</span>
                    </label>

                    <button onClick={logout} className="w-full p-4 bg-red-400/10 text-red-400 rounded-sub font-bold flex items-center justify-center space-x-2 border border-red-400/20 active:bg-red-400/20"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg><span>Cerrar Sesión</span></button>
                  </>
                )}
              </div>

              <div className="mt-20 px-10">
                <BibleVerse isCollapsed={false} />
              </div>
            </div>
          </main>

          {/* Mobile Bottom Navigation Bar */}
          <div className={`md:hidden fixed bottom-1 left-4 right-4 z-[100] bg-main/60 backdrop-blur-2xl border border-white/5 rounded-2xl px-1 py-1 mb-2 shadow-2xl ${selectedSong ? 'hidden' : 'block'}`}>
            <div className="flex justify-around items-center">
              <button
                onClick={() => { setActiveTab('library'); setSelectedSong(null); }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'library' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg>
                <span className="text-[8px] font-bold mt-0.5">Inicio</span>
              </button>
              <button
                onClick={() => { setActiveTab('search'); setSelectedSong(null); }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'search' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
                <span className="text-[8px] font-bold mt-0.5">Buscar</span>
              </button>
              <button
                onClick={() => { setActiveTab('setlists'); setSelectedSong(null); }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'setlists' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg>
                <span className="text-[8px] font-bold mt-0.5">Listas</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setActiveTab('admin'); setSelectedSong(null); }}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'admin' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                  <span className="text-[8px] font-bold mt-0.5">Perfil</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modals & Forms */}
        {selectedSong && <PlayerModal song={selectedSong} onClose={() => setSelectedSong(null)} />}
        {showSongForm && isAdmin && <SongForm initialData={editingSong} onSubmit={handleSaveSong} onCancel={() => { setShowSongForm(false); setEditingSong(null); }} />}
        {showSetlistForm && isAdmin && <SetlistForm songs={songs} initialData={editingSetlist} onSubmit={handleSaveSetlist} onCancel={() => { setShowSetlistForm(false); setEditingSetlist(null); }} />}
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <ConfirmationModal
          isOpen={isDeleteSetlistModalOpen}
          onClose={() => {
            setIsDeleteSetlistModalOpen(false);
            setSetlistToDelete(null);
          }}
          onConfirm={handleConfirmDeleteSetlist}
          title="Confirmar eliminación"
          message="¿Estás seguro de que quieres eliminar este setlist?"
        />
        <ConfirmationModal
          isOpen={isDeleteSongModalOpen}
          onClose={() => {
            setIsDeleteSongModalOpen(false);
            setSongToDeleteInfo(null);
          }}
          onConfirm={handleConfirmDeleteSong}
          title="Confirmar eliminación"
          message={songToDeleteInfo?.count > 1
            ? `¿Estás seguro de que quieres eliminar estas ${songToDeleteInfo.count} canciones?`
            : "¿Estás seguro de que quieres eliminar esta canción?"
          }
        />
        {songToDuplicate && (
          <DuplicateModal
            song={songToDuplicate}
            onConfirm={handleConfirmDuplicate}
            onCancel={() => setSongToDuplicate(null)}
          />
        )}
        {showAdminPanel && isAdmin && (
          <AdminPanel
            onClose={() => setShowAdminPanel(false)}
            onBackup={handleBackup}
            onRestore={handleRestore}
            onLogout={logout}
          />
        )}
        <CustomAlert
          isOpen={restoreAlert.isOpen}
          onClose={() => {
            setRestoreAlert({ isOpen: false, file: null, event: null });
            if (restoreAlert.event) restoreAlert.event.target.value = '';
          }}
          onConfirm={confirmRestore}
          title="Confirmar Restauración"
          message="¿Estás seguro de restaurar? Esto borrará todos los datos actuales y los reemplazará con el archivo de copia de seguridad."
          type="confirm"
        />
        <CustomAlert
          isOpen={successAlert.isOpen}
          onClose={() => setSuccessAlert({ isOpen: false, message: '' })}
          title="¡Éxito!"
          message={successAlert.message}
          type="success"
        />
        <CustomAlert
          isOpen={errorAlert.isOpen}
          onClose={() => setErrorAlert({ isOpen: false, message: '' })}
          title="Error"
          message={errorAlert.message}
          type="error"
        />
      </div>
    </>
  );
}

export default App;