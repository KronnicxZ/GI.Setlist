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
        <div className="sticky top-20 md:top-24 z-30 bg-primary px-4 md:px-6 py-3 rounded-sub flex items-center justify-between shadow-2xl animate-fade-in mx-1 md:mx-0">
          <div className="flex items-center space-x-3">
            <span className="text-black font-black text-xs md:text-sm uppercase tracking-wider">{selectedSongs.length} <span className="hidden xs:inline">seleccionados</span></span>
            <div className="h-4 w-px bg-black/20"></div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 text-black/70 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {setlists && setlists.length > 0 && (
              <div className="relative group/setlist">
                <button className="flex items-center space-x-2 px-3 py-2 text-xs md:text-sm font-semibold text-black bg-white/20 hover:bg-white/30 rounded-sub transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                  <span className="hidden sm:inline">Añadir</span>
                </button>
                <div className="absolute right-0 mt-2 w-56 py-2 bg-[#0a0a0a] border border-white/10 rounded-sub shadow-2xl invisible group-hover/setlist:visible z-30 animate-fade-in backdrop-blur-3xl">
                  {setlists.map(setlist => (
                    <button
                      key={setlist.id || setlist._id}
                      onClick={() => { onAddToSetlist(selectedSongs, setlist.id || setlist._id); setSelectedSongs([]); }}
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

      <div className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-main border border-white/5 bg-white/[0.01] overflow-x-auto custom-scrollbar shadow-inner">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] text-gray-400 uppercase tracking-widest bg-white/[0.03] glass">
                {isAdmin && <th className="py-5 px-6 font-bold w-12 border-b border-white/5 text-center">
                  <button onClick={() => setSelectedSongs(selectedSongs.length === songs.length ? [] : songs.map(s => s.id || s._id))} className={`w-4 h-4 border-2 rounded transition-all inline-flex items-center justify-center ${selectedSongs.length === songs.length && songs.length > 0 ? 'bg-primary border-primary' : 'border-white/10'}`}>
                    {selectedSongs.length === songs.length && songs.length > 0 && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>}
                  </button>
                </th>}
                <th className="py-5 px-6 font-bold border-b border-white/5">Pista</th>
                <th className="py-5 px-6 font-bold border-b border-white/5">Artista</th>
                <th className="py-5 px-6 font-bold border-b border-white/5 hidden lg:table-cell">Género</th>
                <th className="py-5 px-6 font-bold border-b border-white/5">BPM</th>
                <th className="py-5 px-6 font-bold border-b border-white/5 text-center">Tono</th>
                <th className="py-5 px-6 font-bold border-b border-white/5 text-right">Duración</th>
                {isAdmin && <th className="py-5 px-6 font-bold border-b border-white/5 w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {isAdmin && <td className="py-4 px-6"><div className="w-4 h-4 bg-white/5 rounded mx-auto"></div></td>}
                  <td className="py-4 px-6"><div className="flex items-center space-x-4"><div className="w-10 h-10 bg-white/5 rounded-sub"></div><div className="w-32 h-3 bg-white/5 rounded-full"></div></div></td>
                  <td className="py-4 px-6"><div className="w-24 h-2.5 bg-white/5 rounded-full"></div></td>
                  <td className="py-4 px-6 hidden lg:table-cell"><div className="w-16 h-4 bg-white/5 rounded-full"></div></td>
                  <td className="py-4 px-6"><div className="w-8 h-3 bg-white/5 rounded-full"></div></td>
                  <td className="py-4 px-6 text-center"><div className="w-6 h-4 bg-white/5 rounded mx-auto"></div></td>
                  <td className="py-4 px-6 text-right"><div className="w-10 h-3 bg-white/5 rounded-full ml-auto"></div></td>
                  {isAdmin && <td className="py-4 px-6 text-right"><div className="w-8 h-8 bg-white/5 rounded-lg ml-auto"></div></td>}
                </tr>
              )) : songs.map((song) => (
                <tr key={song.id || song._id} className="group hover:bg-white/[0.02] cursor-pointer" onClick={() => onSongSelect(song)}>
                  {isAdmin && <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleSelectSong(e, song.id || song._id)} className={`w-4 h-4 border-2 rounded ${selectedSongs.includes(song.id || song._id) ? 'bg-primary border-primary' : 'border-white/10'}`}>
                      {selectedSongs.includes(song.id || song._id) && <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>}
                    </button>
                  </td>}
                  <td className="py-4 px-6"><div className="flex items-center space-x-3">{(() => { const vId = extractYoutubeVideoId(song.youtubeUrl); return vId ? <img src={`https://img.youtube.com/vi/${vId}/default.jpg`} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-gray-600"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" /></svg></div> })()}<span className="font-bold text-sm truncate max-w-[200px]">{song.title}</span></div></td>
                  <td className="py-4 px-6 text-sm text-gray-400 truncate max-w-[150px]">{song.artist || '-'}</td>
                  <td className="py-4 px-6 hidden lg:table-cell text-[10px] uppercase font-bold text-gray-500">{song.genre || '-'}</td>
                  <td className="py-4 px-6 text-sm font-mono text-gray-300">{song.bpm || '-'}</td>
                  <td className="py-4 px-6 text-center font-black text-primary">{song.key || '-'}</td>
                  <td className="py-4 px-6 text-right text-xs text-gray-500 font-mono">{song.duration || songDurations[song.id || song._id] || '--:--'}</td>
                  {isAdmin && <td className="py-4 px-6 text-right relative song-menu-container" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setOpenMenuId(openMenuId === (song.id || song._id) ? null : (song.id || song._id))} className="p-2 text-gray-600 hover:text-white"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" /></svg></button>
                    {openMenuId === (song.id || song._id) && <div className="absolute right-6 top-10 w-40 bg-[#0a0a0a] border border-white/10 rounded-sub shadow-2xl z-50 py-2 text-left backdrop-blur-3xl"><button onClick={() => { onEditSong(song); setOpenMenuId(null); }} className="w-full px-4 py-2 text-xs hover:bg-white/5">Editar</button><button onClick={() => { onDuplicateSong(song); setOpenMenuId(null); }} className="w-full px-4 py-2 text-xs hover:bg-white/5">Duplicar</button><button onClick={() => { onDeleteSong(song.id || song._id); setOpenMenuId(null); }} className="w-full px-4 py-2 text-xs text-red-500/70 hover:bg-red-500/10">Eliminar</button></div>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col space-y-3 w-full">
          {loading ? [...Array(4)].map((_, i) => (
            <div key={`m-sk-${i}`} className="bg-white/5 rounded-2xl p-4 animate-pulse h-20"></div>
          )) : songs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm italic">No se encontraron temas</div>
          ) : (
            songs.map((song) => (
              <div key={song.id || song._id} onClick={() => onSongSelect(song)} className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all active:scale-[0.98] ${selectedSongs.includes(song.id || song._id) ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/5' : 'bg-white/[0.03] border-white/5'}`}>
                {isAdmin && <div onClick={e => handleSelectSong(e, song.id || song._id)} className="shrink-0 flex items-center justify-center p-1"><div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedSongs.includes(song.id || song._id) ? 'bg-primary border-primary' : 'border-white/10'}`}>{selectedSongs.includes(song.id || song._id) && <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>}</div></div>}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">{(() => { const vId = extractYoutubeVideoId(song.youtubeUrl); return vId ? <img src={`https://img.youtube.com/vi/${vId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-700 bg-white/5"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" /></svg></div> })()}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-0.5"><h3 className="font-bold text-sm text-white truncate pr-2 uppercase">{song.title}</h3><span className="text-[10px] font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded uppercase leading-none">{song.key || '-'}</span></div><div className="flex items-center justify-between"><p className="text-[11px] text-gray-500 truncate pr-2">{song.artist || 'Artista desconocido'}</p><div className="flex items-center space-x-2 shrink-0"><span className="text-[9px] font-mono text-gray-400">{song.duration || songDurations[song.id || song._id] || '--:--'}</span></div></div></div>
                {isAdmin && <div className="shrink-0 relative song-menu-container" onClick={e => e.stopPropagation()}><button onClick={() => setOpenMenuId(openMenuId === (song.id || song._id) ? null : (song.id || song._id))} className="p-2 text-gray-500 active:text-white"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" /></svg></button>{openMenuId === (song.id || song._id) && <div className="absolute right-0 top-full mt-1 w-32 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 py-1 backdrop-blur-3xl overflow-hidden"><button onClick={() => { onEditSong(song); setOpenMenuId(null); }} className="w-full px-4 py-2.5 text-left text-xs text-gray-300">Editar</button><button onClick={() => { onDuplicateSong(song); setOpenMenuId(null); }} className="w-full px-4 py-2.5 text-left text-xs text-gray-300">Duplicar</button><button onClick={() => { onDeleteSong(song.id || song._id); setOpenMenuId(null); }} className="w-full px-4 py-2.5 text-left text-xs text-red-500/70">Eliminar</button></div>}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SongList;