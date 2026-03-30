import React from 'react';
import BibleVerse from './BibleVerse';

const Sidebar = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  handleLogoClick,
  isAdmin,
  setEditingSong,
  setShowSongForm,
  setEditingSetlist,
  setShowSetlistForm,
  activeTab,
  setActiveTab,
  selectedSetlist,
  setSelectedSetlist,
  setlists,
  openMenuId,
  setOpenMenuId,
  handleDeleteSetlist,
  setShowAdminPanel
}) => {
  return (
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
            <div className="flex items-center space-x-3 group min-w-0 cursor-pointer active:scale-95 transition-transform" onClick={handleLogoClick}>
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
                <div onClick={() => { setActiveTab('library'); setSelectedSetlist(null); }} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub'} cursor-pointer transition-all ${isSidebarCollapsed ? (!selectedSetlist && activeTab === 'library' ? 'text-primary' : 'text-gray-400 hover:text-white') : (!selectedSetlist && activeTab === 'library' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white')}`} title={isSidebarCollapsed ? "Biblioteca Global" : ""}>
                  <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex-shrink-0 flex items-center justify-center ${!selectedSetlist ? 'bg-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-white/5'}`}><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12,13A5,5 0 0,1 7,8H9A3,3 0 0,0 12,11A3,3 0 0,0 15,8H17A5,5 0 0,1 12,13M12,3A3,3 0 0,1 15,6H9A3,3 0 0,1 12,3M19,6H17A5,5 0 0,0 12,1A5,5 0 0,0 7,6H5C3.89,6 3,6.89 3,8V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V8C21,6.89 20.11,6 19,6Z" /></svg></div>
                  {!isSidebarCollapsed && <span className="font-medium text-sm">Biblioteca Global</span>}
                </div>
                {setlists.map((setlist) => (
                  <div key={setlist.id} className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'justify-between px-4 py-2 rounded-sub'} group transition-all ${isSidebarCollapsed ? (selectedSetlist?.id === setlist.id && activeTab === 'library' ? 'text-primary' : 'text-gray-400 hover:text-white') : (selectedSetlist?.id === setlist.id && activeTab === 'library' ? 'bg-primary/10 text-primary border-l-2 border-primary' : 'text-gray-400 hover:bg-white/[0.03] hover:text-white')} cursor-pointer`} title={isSidebarCollapsed ? setlist.name : ""} onClick={() => { setActiveTab('library'); setSelectedSetlist(setlist); }}>
                    <div className={`flex items-center ${isSidebarCollapsed ? '' : 'space-x-3'} flex-1 min-w-0`}>
                      <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex-shrink-0 flex items-center justify-center ${selectedSetlist?.id === setlist.id ? 'bg-primary/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-white/5'}`}><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg></div>
                      {!isSidebarCollapsed && (
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate">{setlist.name}</span>
                          {setlist.date && (
                            <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                              {new Date(setlist.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity space-x-1 setlist-menu-container">
                        {isAdmin && <button onClick={(e) => { e.stopPropagation(); setEditingSetlist(setlist); setShowSetlistForm(true); }} className="p-1 hover:text-primary rounded-lg hover:bg-white/5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg></button>}
                        <div className="relative">
                          <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === setlist.id ? null : setlist.id); }} className="p-1 hover:text-white rounded-lg hover:bg-white/5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" /></svg></button>
                          {openMenuId === setlist.id && <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-white/10 rounded-sub shadow-2xl py-1 z-50 overflow-hidden animate-fade-in glass">{isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteSetlist(setlist.id); setOpenMenuId(null); }} className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 font-medium">Eliminar</button>}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              {!isSidebarCollapsed && <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 px-4 mt-6">Utilidades</h2>}
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('tools'); setSelectedSetlist(null); }}
                  className={`flex items-center w-full ${isSidebarCollapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub hover:bg-white/[0.03] text-gray-400 hover:text-white transition-all'} ${activeTab === 'tools' && !isSidebarCollapsed ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''}`}
                  title={isSidebarCollapsed ? "Herramientas" : ""}
                >
                  <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center ${activeTab === 'tools' ? 'text-primary border-primary' : ''}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" /></svg>
                  </div>
                  {!isSidebarCollapsed && <span className="font-medium">Herramientas</span>}
                </button>
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
  );
};

export default Sidebar;
