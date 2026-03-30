import React from 'react';
import PlayerModal from './PlayerModal';
import SongForm from './SongForm';
import SetlistForm from './SetlistForm';
import LoginModal from './LoginModal';
import ConfirmationModal from './ConfirmationModal';
import DuplicateModal from './DuplicateModal';
import AdminPanel from './AdminPanel';
import CustomAlert from './CustomAlert';
import ChatAI from './tools/ChatAI';

const ModalsContainer = ({
  selectedSong, setSelectedSong,
  showSongForm, setShowSongForm, editingSong, setEditingSong, handleSaveSong,
  showSetlistForm, setShowSetlistForm, editingSetlist, setEditingSetlist, handleSaveSetlist,
  songs,
  showLoginModal, setShowLoginModal,
  isDeleteSetlistModalOpen, setIsDeleteSetlistModalOpen, setSetlistToDelete, handleConfirmDeleteSetlist,
  isDeleteSongModalOpen, setIsDeleteSongModalOpen, songToDeleteInfo, setSongToDeleteInfo, handleConfirmDeleteSong,
  songToDuplicate, setSongToDuplicate, handleConfirmDuplicate,
  showAdminPanel, setShowAdminPanel, handleBackup, handleRestore, logout, isAdmin,
  restoreAlert, setRestoreAlert, confirmRestore,
  successAlert, setSuccessAlert,
  errorAlert, setErrorAlert,
  isAIChatOpen, setIsAIChatOpen
}) => {
  return (
    <>
      {/* Modals & Forms */}
      {selectedSong && <PlayerModal song={selectedSong} onClose={() => setSelectedSong(null)} />}
      
      {showSongForm && isAdmin && (
        <SongForm 
          initialData={editingSong} 
          onSubmit={handleSaveSong} 
          onCancel={() => { setShowSongForm(false); setEditingSong(null); }} 
        />
      )}
      
      {showSetlistForm && isAdmin && (
        <SetlistForm 
          songs={songs} 
          initialData={editingSetlist} 
          onSubmit={handleSaveSetlist} 
          onCancel={() => { setShowSetlistForm(false); setEditingSetlist(null); }} 
        />
      )}

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

      {/* Floating AI Button (Global) */}
      {!isAIChatOpen && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[150] bg-[#1a1a1a] text-primary border border-primary/30 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full shadow-xl hover:bg-primary hover:text-black hover:border-primary active:scale-95 transition-all group backdrop-blur-md"
          title="Asistente de IA"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:animate-pulse" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z" />
          </svg>
        </button>
      )}

      {/* Global AI Chat Modal overlay */}
      {isAIChatOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-8 z-[200] flex items-center justify-center md:items-end md:justify-end p-4 md:p-0 bg-black/80 md:bg-transparent md:pointer-events-none">
          <div className="w-full max-w-lg md:w-[380px] h-[85vh] md:h-[550px] max-h-[85vh] relative animate-fade-in pointer-events-auto">
            <button 
              onClick={() => setIsAIChatOpen(false)}
              className="absolute -top-12 right-0 md:-top-4 md:-right-4 text-gray-400 hover:text-white bg-black/50 hover:bg-black/90 md:bg-[#1a1a1a] w-10 h-10 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/20 z-[202]"
            >
              <svg className="w-6 h-6 md:w-4 md:h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
            <ChatAI isPopup={true} />
          </div>
        </div>
      )}
    </>
  );
};

export default ModalsContainer;
