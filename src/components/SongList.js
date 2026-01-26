import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { extractYoutubeVideoId } from '../utils/youtube';

const SongList = ({
  songs,
  onSongSelect,
  onEditSong,
  onDeleteSong,
  onDuplicateSong,
  setlists,
  onAddToSetlist,
  isRemovingFromSetlist,
  externalDurations,
  loading,
  onClearFilters
}) => {
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [songDurations, setSongDurations] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.song-menu-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (externalDurations) {
      setSongDurations(externalDurations);
    }
  }, [externalDurations]);

  const handleSelectSong = (e, id) => {
    e.stopPropagation();
    setSelectedSongs(prev =>
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    onDeleteSong(selectedSongs);
    setSelectedSongs([]);
  };

  return (
    <div className="space-y-4">
      {/* Barra de acciones masivas */}
      {selectedSongs.length > 0 && isAdmin && (
        <div className="sticky top-24 z-30 bg-primary px-6 py-3 rounded-sub flex items-center justify-between shadow-2xl animate-slide-up">
          <div className="flex items-center space-x-4">
            <span className="text-black font-black text-sm uppercase tracking-wider">{selectedSongs.length} seleccionados</span>
            <div className="h-4 w-px bg-black/20"></div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 text-black/70 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
              <span>Eliminar selección</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {setlists && setlists.length > 0 && (
              <div className="relative group">
                <button
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-black bg-white/20 hover:bg-white/30 rounded-sub transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  <span>Añadir a Setlist</span>
                </button>
                <div className="absolute right-0 mt-2 w-56 py-2 bg-card border border-white/10 rounded-sub shadow-2xl invisible group-hover:visible z-30 animate-fade-in glass">
                  {setlists.map(setlist => (
                    <button
                      key={setlist.id || setlist._id}
                      onClick={() => {
                        onAddToSetlist(selectedSongs, setlist.id || setlist._id);
                        setSelectedSongs([]);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {setlist.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setSelectedSongs([])} className="p-2 text-black/50 hover:text-black"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg></button>
          </div>
        </div>
      )}

      <div className="rounded-main border border-white/5 bg-white/[0.01] overflow-hidden">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase tracking-widest">
              {isAdmin && (
                <th className="py-5 px-6 font-bold w-12 border-b border-white/5 bg-white/[0.03] glass">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => setSelectedSongs(selectedSongs.length === songs.length ? [] : songs.map(s => s.id || s._id))}
                      className={`w-4 h-4 border-2 rounded transition-all flex items-center justify-center ${selectedSongs.length === songs.length && songs.length > 0 ? 'bg-primary border-primary' : 'border-white/10 hover:border-primary/40'}`}
                    >
                      {selectedSongs.length === songs.length && songs.length > 0 && (
                        <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>
                      )}
                    </button>
                  </div>
                </th>
              )}
              <th className={`py-5 px-6 font-bold border-b border-white/5 bg-white/[0.03] glass ${!isAdmin ? 'rounded-tl-main' : ''}`}>Pista</th>
              <th className="py-5 px-6 font-bold border-b border-white/5 hidden md:table-cell bg-white/[0.03] glass">Artista</th>
              <th className="py-5 px-6 font-bold border-b border-white/5 hidden lg:table-cell bg-white/[0.03] glass">Género</th>
              <th className="py-5 px-6 font-bold border-b border-white/5 hidden sm:table-cell bg-white/[0.03] glass">BPM</th>
              <th className="py-5 px-6 font-bold border-b border-white/5 hidden sm:table-cell text-center bg-white/[0.03] glass">Tono</th>
              <th className="py-5 px-6 font-bold border-b border-white/5 hidden md:table-cell text-right bg-white/[0.03] glass">Duración</th>
              {isAdmin && (
                <th className="py-5 px-6 font-bold border-b border-white/5 w-16 rounded-tr-main bg-white/[0.03] glass"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              // Skeletons de carga premium
              [...Array(6)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {isAdmin && <td className="py-4 px-6 border-b border-white/5"><div className="w-4 h-4 bg-white/5 rounded mx-auto"></div></td>}
                  <td className="py-4 px-6 border-b border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-10 bg-gradient-to-br from-white/5 to-white/10 rounded-sub"></div>
                      <div className="space-y-3 flex-1">
                        <div className="w-48 h-3.5 bg-gradient-to-r from-white/5 to-white/10 rounded-full"></div>
                        <div className="w-32 h-2.5 bg-gradient-to-r from-white/5 to-white/10 rounded-full"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 border-b border-white/5 hidden md:table-cell">
                    <div className="w-28 h-3 bg-white/5 rounded-full"></div>
                  </td>
                  <td className="py-4 px-6 border-b border-white/5 hidden lg:table-cell">
                    <div className="w-20 h-5 bg-white/5 rounded-full"></div>
                  </td>
                  <td className="py-4 px-6 border-b border-white/5 hidden sm:table-cell">
                    <div className="w-12 h-3.5 bg-white/5 rounded-full"></div>
                  </td>
                  <td className="py-4 px-6 border-b border-white/5 hidden sm:table-cell text-center">
                    <div className="w-8 h-4 bg-white/5 rounded mx-auto"></div>
                  </td>
                  <td className="py-4 px-6 border-b border-white/5 hidden md:table-cell text-right">
                    <div className="w-14 h-3 bg-white/5 rounded-full ml-auto"></div>
                  </td>
                  {isAdmin && <td className="py-4 px-6 border-b border-white/5 text-right">
                    <div className="w-8 h-8 bg-white/5 rounded-lg ml-auto"></div>
                  </td>}
                </tr>
              ))
            ) : songs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-5 animate-fade-in">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                      <svg className="w-10 h-10 text-primary/30" viewBox="0 0 24 24"><path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">No se encontraron temas</h3>
                      <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">Prueba ajustando los filtros o realiza una búsqueda diferente para encontrar lo que buscas.</p>
                    </div>
                    {onClearFilters && (
                      <button
                        onClick={onClearFilters}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                      >
                        Limpiar todos los filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              songs.map((song, index) => (
                <tr
                  key={song.id || song._id}
                  className={`group cursor-pointer hover:bg-white/[0.03] transition-all relative ${selectedSongs.includes(song.id || song._id) ? 'bg-primary/5' : ''}`}
                  onClick={() => onSongSelect(song)}
                >
                  {isAdmin && (
                    <td className="py-4 px-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <div
                          onClick={(e) => handleSelectSong(e, song.id || song._id)}
                          className={`w-4 h-4 border-2 rounded transition-all cursor-pointer flex items-center justify-center ${selectedSongs.includes(song.id || song._id) ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-white/10 hover:border-primary/40'}`}
                        >
                          {selectedSongs.includes(song.id || song._id) && (
                            <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      {(() => {
                        const videoId = extractYoutubeVideoId(song.youtubeUrl);
                        const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
                        return (
                          <div className="w-14 h-10 rounded-sub overflow-hidden bg-white/5 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                            {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : (
                              <div className="w-full h-full flex items-center justify-center text-primary/30">
                                <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" /></svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate mb-0.5">{song.title}</div>
                        <div className="text-[11px] text-gray-500 font-medium truncate md:hidden">{song.artist || 'Artista desconocido'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-400 font-medium hidden md:table-cell">{song.artist || '-'}</td>
                  <td className="py-4 px-6 text-[10px] hidden lg:table-cell">
                    <span className="px-2 py-1 bg-white/5 rounded-full text-gray-500 uppercase font-black tracking-wider group-hover:bg-primary/10 group-hover:text-primary transition-all transition-duration-300">
                      {song.genre || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-mono hidden sm:table-cell">
                    {song.bpm ? (
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"></div>
                        <span>{song.bpm}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm font-black text-primary text-center hidden sm:table-cell uppercase tracking-tighter">{song.key || song.originalKey || '-'}</td>
                  <td className="py-4 px-6 text-[11px] text-gray-500 font-mono text-right hidden md:table-cell">{song.duration || songDurations[song.id || song._id] || '--:--'}</td>
                  {isAdmin && (
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end relative song-menu-container">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === (song.id || song._id) ? null : (song.id || song._id)); }}
                          className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" /></svg>
                        </button>
                        {openMenuId === (song.id || song._id) && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-[#0a0a0a] border border-white/10 rounded-sub shadow-2xl py-2 z-50 overflow-hidden animate-fade-in glass">
                            <button onClick={(e) => { e.stopPropagation(); onEditSong(song); setOpenMenuId(null); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg>
                              <span className="font-bold">Editar</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDuplicateSong(song); setOpenMenuId(null); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>
                              <span className="font-bold">Duplicar</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteSong(song.id || song._id); setOpenMenuId(null); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                              <span className="font-bold">Eliminar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SongList;