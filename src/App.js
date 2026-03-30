import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useData } from './hooks/useData';
import { useSongFilters } from './hooks/useSongFilters';
import { useBackup } from './hooks/useBackup';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import ModalsContainer from './components/ModalsContainer';
import SongList from './components/SongList';
import ToolsScreen from './components/tools/ToolsScreen';
import BibleVerse from './components/BibleVerse';
import PrintSetview from './components/PrintSetview';

function App() {
  const API_URL = process.env.REACT_APP_API_URL || '/api';
  const { isAdmin, logout } = useAuth();
  
  // Custom Hooks
  const { 
    songs, setSongs, setlists, setSetlists, loading, 
    saveSong, deleteSong, saveSetlist, deleteSetlist, 
    addToSetlist, removeFromSetlist 
  } = useData(API_URL);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [genreFilter, setGenreFilter] = useState('Todas');
  const [selectedSetlist, setSelectedSetlist] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [showSongForm, setShowSongForm] = useState(false);
  const [showSetlistForm, setShowSetlistForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [editingSetlist, setEditingSetlist] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDeleteSetlistModalOpen, setIsDeleteSetlistModalOpen] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState(null);
  const [isDeleteSongModalOpen, setIsDeleteSongModalOpen] = useState(false);
  const [songToDeleteInfo, setSongToDeleteInfo] = useState(null);
  const [songToDuplicate, setSongToDuplicate] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // Alert States
  const [successAlert, setSuccessAlert] = useState({ isOpen: false, message: '' });
  const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: '' });

  const { restoreAlert, setRestoreAlert, handleBackup, handleRestore, confirmRestore } = 
    useBackup(API_URL, setSuccessAlert, setErrorAlert);

  const { contextSongs, filteredSongs } = 
    useSongFilters(songs, selectedSetlist, searchTerm, genreFilter, sortBy);

  // 1. Handlers
  const handleLogoClick = () => setLogoClicks(prev => prev + 1);
  
  useEffect(() => {
    if (logoClicks >= 5) {
      setShowLoginModal(true);
      setLogoClicks(0);
    }
    const timer = setTimeout(() => setLogoClicks(0), 3000);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.setlist-menu-container')) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Business Handlers (using useData)
  const onSaveSong = async (data) => {
    try {
      await saveSong(data, editingSong?.id);
      setShowSongForm(false);
      setEditingSong(null);
    } catch (err) { console.error(err); }
  };

  const onConfirmDuplicate = async (data) => {
    try {
      await saveSong(data);
      setSongToDuplicate(null);
    } catch (err) { console.error(err); }
  };

  const onDeleteSongHandler = (idOrIds, callback) => {
    const count = Array.isArray(idOrIds) ? idOrIds.length : 1;
    setSongToDeleteInfo({ ids: idOrIds, count, onSuccess: callback });
    setIsDeleteSongModalOpen(true);
  };

  const onConfirmDeleteSong = async () => {
    if (!songToDeleteInfo) return;
    try {
      await deleteSong(songToDeleteInfo.ids || songToDeleteInfo.id);
      if (songToDeleteInfo.onSuccess) songToDeleteInfo.onSuccess();
    } catch (err) { console.error(err); } finally {
      setIsDeleteSongModalOpen(false);
      setSongToDeleteInfo(null);
    }
  };

  const onSaveSetlistHandler = async (data) => {
    try {
      await saveSetlist(data, editingSetlist?.id);
      setShowSetlistForm(false);
      setEditingSetlist(null);
    } catch (err) { console.error(err); }
  };

  const onRemoveFromSetlistHandler = async (idOrIds, callback) => {
    if (!selectedSetlist) return;
    try {
      const updated = await removeFromSetlist(idOrIds, selectedSetlist.id);
      setSelectedSetlist(updated);
      setSuccessAlert({ isOpen: true, message: 'Se quitaron las canciones con éxito' });
      if (callback) callback();
    } catch (err) { setErrorAlert({ isOpen: true, message: 'No se pudieron quitar' }); }
  };

  const onAddToSetlistHandler = async (ids, setlistId) => {
    try {
      const updated = await addToSetlist(ids, setlistId);
      if (selectedSetlist?.id === setlistId) setSelectedSetlist(updated);
      setSuccessAlert({ isOpen: true, message: 'Canciones añadidas con éxito' });
    } catch (err) { setErrorAlert({ isOpen: true, message: 'No se pudieron añadir' }); }
  };

  const onDeleteSetlistHandler = (id) => {
    setlistToDelete(id);
    setIsDeleteSetlistModalOpen(true);
  };

  const onConfirmDeleteSetlist = async () => {
    if (!setlistToDelete) return;
    try {
      await deleteSetlist(setlistToDelete);
      if (selectedSetlist?.id === setlistToDelete) setSelectedSetlist(null);
    } finally {
      setIsDeleteSetlistModalOpen(false);
      setlistToDelete(null);
    }
  };

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

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-main text-white md:gap-4 overflow-hidden">
      <Sidebar 
        isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
        handleLogoClick={handleLogoClick} isAdmin={isAdmin}
        setEditingSong={setEditingSong} setShowSongForm={setShowSongForm}
        setEditingSetlist={setEditingSetlist} setShowSetlistForm={setShowSetlistForm}
        activeTab={activeTab} setActiveTab={setActiveTab}
        selectedSetlist={selectedSetlist} setSelectedSetlist={setSelectedSetlist}
        setlists={setlists} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId}
        handleDeleteSetlist={onDeleteSetlistHandler} setShowAdminPanel={setShowAdminPanel}
      />

      <div className={`flex-1 flex flex-col h-full relative overflow-hidden ${(selectedSong || showSongForm) ? 'hidden md:flex' : 'flex'}`}>
        <Header 
          selectedSetlist={selectedSetlist} setSelectedSetlist={setSelectedSetlist}
          filteredSongs={filteredSongs} activeTab={activeTab} 
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          setSortBy={setSortBy} isAdmin={isAdmin}
          setEditingSong={setEditingSong} setShowSongForm={setShowSongForm}
          handleLogoClick={handleLogoClick} genreFilter={genreFilter}
          setGenreFilter={setGenreFilter} contextSongs={contextSongs}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 w-full max-w-[1800px] mx-auto overflow-y-auto pt-2 md:pt-8 px-4 md:px-8 custom-scrollbar pb-40 md:pb-8">
          {(activeTab === 'library' || activeTab === 'search') && (
            <SongList
              songs={filteredSongs} onSongSelect={setSelectedSong}
              onEditSong={isAdmin ? (s) => { setEditingSong(s); setShowSongForm(true); } : null}
              onDeleteSong={isAdmin ? (selectedSetlist ? onRemoveFromSetlistHandler : onDeleteSongHandler) : null}
              onDuplicateSong={isAdmin ? setSongToDuplicate : null}
              setlists={isAdmin ? setlists : null} onAddToSetlist={onAddToSetlistHandler}
              loading={loading} onClearFilters={() => { setSearchTerm(''); setGenreFilter('Todas'); }}
            />
          )}

          {activeTab === 'setlists' && (
            <div className="md:hidden space-y-4 pb-10">
              <div onClick={() => { setSelectedSetlist(null); setActiveTab('library'); }} className={`p-5 rounded-sub flex justify-between border ${!selectedSetlist ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-sub flex items-center justify-center text-primary"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg></div>
                  <div><div className="font-bold text-lg">Biblioteca Global</div><div className="text-xs text-gray-500">{songs.length} temas</div></div>
                </div>
              </div>
              {setlists.map(sl => (
                <div key={sl.id} onClick={() => { setSelectedSetlist(sl); setActiveTab('library'); }} className={`p-5 rounded-sub flex justify-between border ${selectedSetlist?.id === sl.id ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/5 rounded-sub flex items-center justify-center text-gray-400"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg></div>
                    <div><div className="font-bold text-lg">{sl.name}</div><div className="text-xs text-gray-500">{sl.songs?.length || 0} temas</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="md:hidden pt-10 text-center px-6">
              <div className="w-24 h-24 bg-primary/10 rounded-main mx-auto flex items-center justify-center mb-6 border border-primary/20">
                <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
              <p className="text-muted mb-10 text-sm">{isAdmin ? 'Acceso de Administrador' : 'Explora la biblioteca'}</p>
              {isAdmin && (
                <div className="space-y-4">
                  <button onClick={handleBackup} className="w-full p-4 bg-primary/10 text-primary rounded-sub font-bold border border-primary/20">Respaldar Datos</button>
                  <label className="w-full p-4 bg-blue-500/10 text-blue-400 rounded-sub font-bold border border-blue-500/20 cursor-pointer block">
                    <input type="file" className="hidden" accept=".json" onChange={handleRestore} /> Restaurar Copia
                  </label>
                  <button onClick={logout} className="w-full p-4 bg-red-400/10 text-red-400 rounded-sub font-bold border border-red-400/20">Cerrar Sesión</button>
                </div>
              )}
              <div className="mt-20"><BibleVerse isCollapsed={false} /></div>
            </div>
          )}

          {activeTab === 'tools' && <div className="pb-20"><ToolsScreen /></div>}
        </main>

        <MobileNav 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          setSelectedSong={setSelectedSong} setSelectedSetlist={setSelectedSetlist}
          isAdmin={isAdmin} selectedSong={selectedSong} showSongForm={showSongForm}
        />

        <ModalsContainer 
          selectedSong={selectedSong} setSelectedSong={setSelectedSong}
          showSongForm={showSongForm} setShowSongForm={setShowSongForm}
          editingSong={editingSong} setEditingSong={setEditingSong}
          handleSaveSong={onSaveSong} songs={songs}
          showSetlistForm={showSetlistForm} setShowSetlistForm={setShowSetlistForm}
          editingSetlist={editingSetlist} setEditingSetlist={setEditingSetlist}
          handleSaveSetlist={onSaveSetlistHandler}
          showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal}
          isDeleteSetlistModalOpen={isDeleteSetlistModalOpen} setIsDeleteSetlistModalOpen={setIsDeleteSetlistModalOpen}
          setSetlistToDelete={setSetlistToDelete} handleConfirmDeleteSetlist={onConfirmDeleteSetlist}
          isDeleteSongModalOpen={isDeleteSongModalOpen} setIsDeleteSongModalOpen={setIsDeleteSongModalOpen}
          songToDeleteInfo={songToDeleteInfo} setSongToDeleteInfo={setSongToDeleteInfo}
          handleConfirmDeleteSong={onConfirmDeleteSong}
          songToDuplicate={songToDuplicate} setSongToDuplicate={setSongToDuplicate}
          handleConfirmDuplicate={onConfirmDuplicate}
          showAdminPanel={showAdminPanel} setShowAdminPanel={setShowAdminPanel}
          handleBackup={handleBackup} handleRestore={handleRestore} logout={logout} isAdmin={isAdmin}
          restoreAlert={restoreAlert} setRestoreAlert={setRestoreAlert} confirmRestore={confirmRestore}
          successAlert={successAlert} setSuccessAlert={setSuccessAlert}
          errorAlert={errorAlert} setErrorAlert={setErrorAlert}
          isAIChatOpen={isAIChatOpen} setIsAIChatOpen={setIsAIChatOpen}
        />

        {selectedSetlist && (
          <PrintSetview 
            setlist={selectedSetlist} 
            songs={contextSongs} 
          />
        )}
      </div>
    </div>
  );
}

export default App;