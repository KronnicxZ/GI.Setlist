import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlayerModal from './PlayerModal';
import SongList from './SongList';

const PublicSetlist = ({ apiUrl }) => {
  const { id } = useParams();
  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicSetlist = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/public/setlists/${id}`);
        if (!response.ok) throw new Error('Setlist no encontrado o enlace caducado');
        const data = await response.json();
        setSetlist(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicSetlist();
  }, [id, apiUrl]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-main text-white">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando Setlist Público...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-main text-white px-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
        <svg className="w-10 h-10" viewBox="0 0 24 24"><path fill="currentColor" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20Z" /></svg>
      </div>
      <h1 className="text-2xl font-black mb-2">¡Ops! Error</h1>
      <p className="text-gray-500 max-w-xs mb-8">{error}</p>
      <a href="/" className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all">Volver al Inicio</a>
    </div>
  );

  return (
    <div className="min-h-screen bg-main text-white pb-20">
      <header className="px-8 py-10 border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] font-bold text-primary uppercase tracking-[.3em] mb-2">Vista de Músico En Vivo</div>
          <h1 className="text-4xl font-black tracking-tight">{setlist.name}</h1>
          {setlist.date && (
            <p className="text-gray-500 font-bold mt-2">
              {new Date(setlist.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10 p-5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center space-x-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" /></svg>
          </div>
          <p className="text-xs font-bold text-primary/80 uppercase tracking-widest leading-relaxed">
            Estás viendo el setlist compartido. Haz clic en cualquier canción para ver la letra y cifrado.
          </p>
        </div>

        <SongList 
          songs={setlist.songs} 
          onSongSelect={setSelectedSong}
          isAdmin={false}
          loading={false}
        />
      </main>

      {selectedSong && (
        <PlayerModal 
          song={selectedSong} 
          onClose={() => setSelectedSong(null)} 
        />
      )}

      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-black/80 backdrop-blur-md border-t border-white/5 text-center px-6">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          Desarrollado por <span className="text-primary opacity-80">GI SETLIST TEAM</span> • Generación Indetenible
        </p>
      </footer>
    </div>
  );
};

export default PublicSetlist;
