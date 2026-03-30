import React from 'react';
import SearchBar from './SearchBar';
import SortFilter from './SortFilter';

const Header = ({
  selectedSetlist,
  setSelectedSetlist,
  filteredSongs,
  activeTab,
  searchTerm,
  setSearchTerm,
  setSortBy,
  isAdmin,
  setEditingSong,
  setShowSongForm,
  handleLogoClick,
  genreFilter,
  setGenreFilter,
  contextSongs,
  setActiveTab
}) => {
  return (
    <>
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
                    {new Date(selectedSetlist.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                  </span>
                )}
                {selectedSetlist && (
                  <span className="text-sm font-bold text-gray-500 px-2 uppercase tracking-widest">{filteredSongs.length} temas</span>
                )}
                {selectedSetlist && (
                  <button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/shared/${selectedSetlist.id || selectedSetlist._id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('Enlace de Setlist copiado al portapapeles. ¡Compártelo con tu banda!');
                    }}
                    className="flex items-center space-x-2 text-xs font-bold text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all no-print"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.53 15.08,18.73 15.08,18.92A3,3 0 0,0 18.08,21.92A3,3 0 0,0 21.08,18.92A3,3 0 0,0 18.08,15.92C17.31,15.92 16.63,16.23 16.08,16.7L18.08,16.08Z" /></svg>
                    <span>Compartir</span>
                  </button>
                )}
                {selectedSetlist && (
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20 hover:bg-primary/20 transition-all no-print"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
                    <span>Imprimir Set</span>
                  </button>
                )}
                {selectedSetlist && <button onClick={() => setSelectedSetlist(null)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors no-print"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg></button>}
              </div>
            </div>
          </div>
          {activeTab !== 'tools' && activeTab !== 'admin' && (
            <div className="flex items-center gap-4 flex-1 max-w-2xl justify-end">
              <div className="flex-1"><SearchBar value={searchTerm} onSearch={setSearchTerm} /></div>
              <div className="min-w-[160px]"><SortFilter onSortChange={setSortBy} /></div>
              {isAdmin && <button onClick={() => { setEditingSong(null); setShowSongForm(true); }} className="bg-primary text-black h-[42px] px-6 rounded-sub font-bold flex items-center justify-center space-x-2 hover:bg-primary-hover shadow-lg active:scale-95 transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg><span>Nueva</span></button>}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header */}
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
                <span className="text-primary ml-1.5 line-clamp-1">
                  {activeTab === 'admin' ? 'Perfil' : activeTab === 'setlists' ? 'Setlists' : activeTab === 'tools' ? 'Herramientas' : activeTab === 'search' ? 'Buscador' : (selectedSetlist ? selectedSetlist.name : 'Setlist')}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedSetlist && (
              <div className="flex items-center space-x-1 mr-1">
                <button 
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/shared/${selectedSetlist.id || selectedSetlist._id}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert('Enlace de Setlist copiado al portapapeles');
                  }}
                  className="p-2 text-gray-400 bg-white/5 border border-white/10 rounded-lg active:bg-white/10 active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.35C15.11,18.53 15.08,18.73 15.08,18.92A3,3 0 0,0 18.08,21.92A3,3 0 0,0 21.08,18.92A3,3 0 0,0 18.08,15.92C17.31,15.92 16.63,16.23 16.08,16.7L18.08,16.08Z" /></svg>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-primary bg-primary/10 border border-primary/20 rounded-lg active:bg-primary/20 active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
                </button>
                <button 
                  onClick={() => setSelectedSetlist(null)} 
                  className="p-2 text-gray-400 hover:text-white rounded-lg active:scale-95 transition-transform"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                </button>
              </div>
            )}
            {(activeTab === 'library' || activeTab === 'search') && !selectedSetlist && (
              <SortFilter onSortChange={setSortBy} compact={true} />
            )}
            {activeTab === 'search' && (
              <button onClick={() => { setActiveTab('library'); setSearchTerm(''); }} className="p-2 text-primary" title="Volver a la biblioteca">
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Genre Tabs Filter - Mobile */}
        {(activeTab === 'library' || activeTab === 'search') && (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
            {['Todas', 'Alabanza', 'Adoración'].map(genre => {
              const normalize = (text) => text?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const count = genre === 'Todas' ? contextSongs.length : contextSongs.filter(s => normalize(s.genre) === normalize(genre)).length;
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

      {/* Genre Tabs Filter - Desktop */}
      {(activeTab === 'library' || activeTab === 'search') && (
        <div className="hidden md:block px-8 mt-4 no-print">
          <div className="max-w-[1800px] mx-auto flex items-center space-x-2 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
            {['Todas', 'Alabanza', 'Adoración'].map(genre => {
              const normalize = (text) => text?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const count = genre === 'Todas' ? contextSongs.length : contextSongs.filter(s => normalize(s.genre) === normalize(genre)).length;
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
      )}
    </>
  );
};

export default Header;
