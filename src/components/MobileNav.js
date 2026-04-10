import React from 'react';

const MobileNav = ({
  activeTab,
  setActiveTab,
  setSelectedSong,
  setSelectedSetlist,
  isAdmin,
  selectedSong,
  showSongForm
}) => {
  if (selectedSong || showSongForm) return null;

  return (
    <div className="md:hidden fixed bottom-1 left-4 right-4 z-[100] bg-main/60 backdrop-blur-2xl border border-white/5 rounded-2xl px-1 py-1 mb-2 shadow-2xl">
      <div className="flex justify-around items-center">
        <button
          onClick={() => { setActiveTab('library'); setSelectedSong(null); setSelectedSetlist(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'library' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg>
          <span className="text-[8px] font-bold mt-0.5">Inicio</span>
        </button>
        <button
          onClick={() => { setActiveTab('setlists'); setSelectedSong(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'setlists' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg>
          <span className="text-[8px] font-bold mt-0.5">Listas</span>
        </button>
        <button
          onClick={() => { setActiveTab('tools'); setSelectedSong(null); }}
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeTab === 'tools' ? 'text-primary bg-primary/10' : 'text-gray-500'}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" /></svg>
          <span className="text-[8px] font-bold mt-0.5">Herram.</span>
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
  );
};

export default MobileNav;
