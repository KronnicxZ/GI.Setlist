import React, { useState, useEffect, useRef } from 'react';

const SetlistForm = ({ songs, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    date: initialData.date ? (new Date(initialData.date).toISOString().split('T')[0] || '') : '',
    songs: (initialData.songs || []).map(s => typeof s === 'object' ? (s.id || s._id) : s)
  } : {
    name: '',
    description: '',
    date: '',
    songs: []
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  
  // States for search and drag-and-drop
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Lógica para el calendario personalizado
  const [viewDate, setViewDate] = useState(formData.date ? new Date(formData.date + 'T00:00:00') : new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    // Usamos T00:00:00 para evitar problemas de zona horaria al crear el objeto Date
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yoffset = selectedDate.getFullYear();
    const moffset = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const doffset = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${yoffset}-${moffset}-${doffset}`;

    setFormData(prev => ({ ...prev, date: dateString }));
    setShowCalendar(false);
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSongToggle = (songId) => {
    setFormData(prev => ({
      ...prev,
      songs: prev.songs.includes(songId)
        ? prev.songs.filter(id => id !== songId)
        : [...prev.songs, songId]
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    // Optional: make it look slightly transparent when dragging
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    
    const newSongs = [...formData.songs];
    const [removed] = newSongs.splice(draggedIdx, 1);
    newSongs.splice(targetIdx, 0, removed);
    
    setFormData(prev => ({ ...prev, songs: newSongs }));
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const filteredAvailableSongs = songs.filter(s => 
    !formData.songs.includes(s.id) &&
    ((s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (s.artist || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-main w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative py-5 px-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {initialData ? 'Editar Setlist' : 'Nuevo Setlist'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">Organiza tu repertorio</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form id="setlist-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre del Setlist</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Domingo de Alabanza"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>

            {/* CALENDARIO PERSONALIZADO */}
            <div className="space-y-2 relative" ref={calendarRef}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha del Servicio</label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white flex justify-between items-center hover:bg-white/[0.08] transition-all font-medium text-sm group"
              >
                <span className={formData.date ? 'text-white' : 'text-gray-500'}>
                  {formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Seleccionar fecha'}
                </span>
                <svg className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.11,3 19,3H18V1M17,12H12V17H17V12Z" />
                </svg>
              </button>

              {showCalendar && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-sub shadow-2xl p-5 z-[200] animate-fade-in glass border-t border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg></button>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-white">
                      {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </div>
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg></button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                      <div key={d} className="text-[10px] font-bold text-gray-600">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth()))].map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {[...Array(daysInMonth(viewDate.getFullYear(), viewDate.getMonth()))].map((_, i) => {
                      const day = i + 1;
                      const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                      const dStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
                      const isSelected = formData.date === dStr;

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ${isSelected
                            ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-110'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Notas generales para este setlist..."
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm resize-none"
            />
          </div>

          <div className="space-y-6">
            
            {/* Canciones Seleccionadas (Con DnD) */}
            {formData.songs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Orden del Setlist <span className="text-gray-600 lowercase">(arrastra)</span></label>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {formData.songs.length} seleccionadas
                  </span>
                </div>

                <div className="flex flex-col gap-2 pr-2">
                  {formData.songs.map((songId, idx) => {
                    const song = songs.find(s => s.id === songId);
                    if (!song) return null;

                    return (
                      <div
                        key={song.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center p-3 rounded-sub border transition-all cursor-move bg-primary/5 ${
                          dragOverIdx === idx ? 'border-primary border-t-2 scale-[1.02] shadow-xl z-10' : 'border-primary/20 hover:border-primary/40'
                        } ${draggedIdx === idx ? 'opacity-50' : 'opacity-100'}`}
                      >
                         <div className="text-primary/50 mr-3 flex-shrink-0">
                           <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M7,19V17H9V19H7M11,19V17H13V19H11M15,19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z" /></svg>
                         </div>
                         
                         <div className="flex-1 min-w-0 flex items-center justify-between pointer-events-none">
                            <div className="truncate pr-4">
                              <div className="text-sm font-bold text-primary truncate">{song.title}</div>
                              <div className="text-xs text-gray-500 truncate">{song.artist || 'Artista desconocido'}</div>
                            </div>
                            <div className="text-right flex-shrink-0 text-gray-500 text-xs font-mono w-12 hidden sm:block">
                              #{idx + 1}
                            </div>
                         </div>
                         
                         <button type="button" onClick={() => handleSongToggle(song.id)} className="p-2 ml-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0 group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>
                         </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Añadir Canciones */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Añadir Canciones</label>
                <div className="relative w-full sm:w-64">
                   <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" /></svg>
                   <input 
                      type="text" 
                      placeholder="Buscar repertorio..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                   />
                </div>
              </div>

              {filteredAvailableSongs.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 text-sm italic border border-white/5 rounded-sub border-dashed">
                   {searchQuery ? 'No se encontraron más canciones' : 'Todas las canciones ya están en el setlist'}
                 </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 pr-2">
                  {filteredAvailableSongs.map(song => (
                    <label
                      key={song.id}
                      className="flex items-center p-3 rounded-sub border bg-white/5 border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleSongToggle(song.id)}
                          className="hidden"
                        />
                        <div className="w-5 h-5 border-2 rounded transition-all flex items-center justify-center border-white/20 text-white group-hover:border-primary/50 group-hover:text-primary">
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors truncate">
                          {song.title}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{song.artist || 'Artista desconocido'}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4 hidden sm:block">
                        {song.key && <div className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">{song.key}</div>}
                        {song.bpm && <div className="text-[10px] font-mono text-gray-600">{song.bpm} BPM</div>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="py-5 px-8 border-t border-white/5 flex items-center justify-end space-x-4 bg-white/[0.01]">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="setlist-form"
            className="px-8 py-3.5 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Setlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetlistForm;