import React, { useState, useEffect, useRef } from 'react';

const SetlistForm = ({ songs, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : ''
  } : {
    name: '',
    description: '',
    date: '',
    songs: []
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

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

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Seleccionar Canciones</label>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {formData.songs.length} seleccionadas
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 pr-2">
              {songs.map(song => (
                <label
                  key={song.id}
                  className={`flex items-center p-4 rounded-sub border transition-all cursor-pointer group ${formData.songs.includes(song.id)
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.songs.includes(song.id)}
                      onChange={() => handleSongToggle(song.id)}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${formData.songs.includes(song.id)
                      ? 'bg-primary border-primary shadow-lg shadow-primary/20'
                      : 'border-white/10 group-hover:border-primary/40'
                      }`}>
                      {formData.songs.includes(song.id) && (
                        <svg className="w-3 h-3 text-black" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className={`text-sm font-bold transition-colors ${formData.songs.includes(song.id) ? 'text-primary' : 'text-white'
                      }`}>
                      {song.title}
                    </div>
                    <div className="text-xs text-gray-500">{song.artist || 'Artista desconocido'}</div>
                  </div>
                  <div className="text-right">
                    {song.key && <div className="text-[10px] font-bold text-primary/80 uppercase mb-1">{song.key}</div>}
                    {song.bpm && <div className="text-[10px] font-mono text-gray-500">{song.bpm} BPM</div>}
                  </div>
                </label>
              ))}
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