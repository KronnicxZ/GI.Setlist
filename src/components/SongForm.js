import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { extractYoutubeVideoId, getVideoDetails, getVideoDuration } from '../utils/youtube';
import { autoBracketChords, formatLyricsForQuill } from '../utils/chordTransposer';

const SongForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    title: initialData?.title || '',
    artist: initialData?.artist || '',
    lyrics: initialData?.lyrics || '',
    bpm: initialData?.bpm || '',
    notes: initialData?.notes || '',
    key: initialData?.key || '',
    originalKey: initialData?.originalKey || '',
    vocalistKey: initialData?.vocalistKey || '',
    genre: initialData?.genre || '',
    youtubeUrl: initialData?.youtubeUrl || ''
  });

  // Efecto para formatear las letras si vienen en texto plano (con \n) en lugar de HTML
  useEffect(() => {
    if (initialData?.lyrics && !initialData.lyrics.includes('<p>') && !initialData.lyrics.includes('<div>')) {
      const formatted = formatLyricsForQuill(initialData.lyrics)
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (trimmed === '') return '<p><br></p>';
          return `<p>${line}</p>`;
        })
        .join('');
      setFormData(prev => ({ ...prev, lyrics: formatted }));
    }
  }, [initialData]);

  const [loadingVideo, setLoadingVideo] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [videoId, setVideoId] = useState(extractYoutubeVideoId(initialData?.youtubeUrl));
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const quillRef = useRef(null);

  const sections = ['Intro', 'Verso', 'Pre-Coro', 'Coro', 'Puente', 'Instrumental', 'Solo', 'Final'];

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Shortcut for Manual Brackets: Ctrl + Shift + B
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        const activeElement = document.activeElement;
        if (activeElement.closest('.ql-editor')) {
          e.preventDefault();
          handleManualBracket();
        }
      }
      // Shortcut for Auto-Format: Ctrl + Shift + F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleAutoFormat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData.lyrics]);

  const genres = ['Alabanza', 'Adoración'];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': ['#FBAE00', '#ffffff', '#a3a3a3', '#ff4444', '#44ff44', '#4444ff'] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'color', 'clean'
  ];

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Sincronizar key con originalKey si key está vacío o si estamos editando originalKey
      if (name === 'originalKey') {
        newData.key = value;
      }

      return newData;
    });

    if (name === 'youtubeUrl') {
      const id = extractYoutubeVideoId(value);
      setVideoId(id);

      if (id) {
        setLoadingVideo(true);

        const details = await getVideoDetails(id);
        if (details) {
          let title = details.title;
          let artist = details.channelTitle.replace(' - Topic', '');

          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0].trim();
            title = parts[1].trim();
          }

          setFormData(prev => ({
            ...prev,
            title: prev.title || title,
            artist: prev.artist || artist
          }));
        }
        setLoadingVideo(false);
      }
    }
  };

  const handleLyricsChange = (content) => {
    setFormData(prev => ({ ...prev, lyrics: content }));
  };

  const handleAutoFormat = () => {
    // 1. Extraer el texto plano de Quill preservando saltos de línea reales
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formData.lyrics
      .replace(/<\/p><p>/g, '\n') // Unificar párrafos
      .replace(/<p>|<div>/g, '')     // Limpiar etiquetas de apertura
      .replace(/<\/p>|<\/div>/g, '\n') // Cierre de bloque es un salto
      .replace(/<br\s*\/?>/g, '\n');  // BR es un salto

    let plainText = tempDiv.innerText;

    // 2. Limpiar saltos de línea excesivos (más de 2 seguidos)
    plainText = plainText.replace(/\n{3,}/g, '\n\n').trim();

    // 3. Aplicar el formateo de acordes y secciones coloreadas para Quill
    const htmlProcessed = formatLyricsForQuill(plainText)
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (trimmed === '') return '<p><br></p>';
        // Si ya viene formateado con spans, no envolverlo en <p> extra si no es necesario, 
        // pero Quill prefiere <p> para cada línea
        return `<p>${line}</p>`;
      })
      .join('');

    setFormData(prev => ({ ...prev, lyrics: htmlProcessed }));
  };

  const insertSection = (sectionName) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    const textToInsert = `[${sectionName.toUpperCase()}]`;

    // Insertamos el texto con color azul (como en el visor) y sin negrita excesiva
    editor.insertText(range.index, textToInsert, {
      'bold': true,
      'color': 'rgb(96, 165, 250)'
    });

    // Añadimos un salto de línea después
    editor.insertText(range.index + textToInsert.length, '\n', 'user');

    // Movemos el cursor al final de la inserción
    editor.setSelection(range.index + textToInsert.length + 1);
  };

  const handleManualBracket = () => {
    const quill = document.querySelector('.ql-editor');
    if (!quill) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      const newNode = document.createTextNode(`[${selectedText}]`);
      range.deleteContents();
      range.insertNode(newNode);

      // Actualizar el estado de formData
      setFormData(prev => ({ ...prev, lyrics: quill.innerHTML }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 md:backdrop-blur-md z-[250] flex items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-surface border-none md:border border-white/10 rounded-none md:rounded-main w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative py-5 px-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {initialData?.title ? 'Editar Canción' : 'Nueva Canción'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">Completa la información de la pista</p>
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

        <form id="song-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* YouTube Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">YouTube URL</label>
            <div className="relative">
              <input
                type="url"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
              {loadingVideo && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {videoId && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/5 aspect-video bg-black relative group/preview">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  frameBorder="0"
                  className="absolute inset-0"
                  title="YouTube Preview"
                ></iframe>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Título</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Nombre de la canción"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Artista</label>
              <input
                type="text"
                name="artist"
                required
                value={formData.artist}
                onChange={handleChange}
                placeholder="Nombre del artista/banda"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!formData.title || !formData.artist) {
                alert("Por favor ingresa primero el Título y Artista.");
                return;
              }
              setLoadingAI(true);
              try {
                // Determine base URL, local development proxy or prod URL.
                const url = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/ai/generate-chords` : `/api/ai/generate-chords`;
                
                const res = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: formData.title, artist: formData.artist })
                });
                
                const data = await res.json();
                
                if (data.lyrics) {
                  // Text formatting directly to Quill
                  const plainText = data.lyrics;
                  const htmlProcessed = formatLyricsForQuill(plainText)
                    .split('\n')
                    .map(line => {
                      const trimmed = line.trim();
                      if (trimmed === '') return '<p><br></p>';
                      return `<p>${line}</p>`;
                    })
                    .join('');
                    
                  setFormData(prev => ({ 
                    ...prev, 
                    lyrics: prev.lyrics && prev.lyrics !== '<p><br></p>' 
                      ? prev.lyrics + htmlProcessed 
                      : htmlProcessed,
                    bpm: data.bpm || prev.bpm,
                    originalKey: data.key || prev.originalKey,
                    key: data.key || prev.key
                  }));
                } else {
                  alert(data.error || 'Error al generar letra.');
                }
              } catch(e) {
                alert('No se pudo conectar con el servidor.');
              }
              setLoadingAI(false);
            }}
            disabled={loadingAI || !formData.title || !formData.artist}
            className="w-full mt-2 flex justify-center items-center space-x-2 px-5 py-3.5 bg-gradient-to-r from-purple-500/20 to-primary/20 border border-purple-500/30 rounded-sub text-white hover:bg-purple-500/30 disabled:opacity-50 transition-all font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            {loadingAI ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generando con IA...</span>
                </>
            ) : (
                <>
                  <span>✨</span>
                  <span>Generar Letra y Acordes con IA (Estilo Chordify)</span>
                </>
            )}
          </button>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">BPM</label>
              <input
                type="number"
                name="bpm"
                min="30"
                max="300"
                value={formData.bpm}
                onChange={handleChange}
                placeholder="120"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tono Original</label>
              <input
                type="text"
                name="originalKey"
                value={formData.originalKey}
                onChange={handleChange}
                placeholder="G, Am..."
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tono Vocalista</label>
              <input
                type="text"
                name="vocalistKey"
                value={formData.vocalistKey}
                onChange={handleChange}
                placeholder="E, C#m..."
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
              />
            </div>
            <div className="space-y-2 relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Género</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowGenreMenu(!showGenreMenu)}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm flex justify-between items-center group/genre"
                >
                  <span className={formData.genre ? 'text-white' : 'text-gray-600'}>
                    {formData.genre || 'Género'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showGenreMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24">
                    <path fill="currentColor" d="M7,10L12,15L17,10H7Z" />
                  </svg>
                </button>

                {showGenreMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-sub shadow-2xl py-2 z-[210] animate-fade-in glass">
                    {genres.map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, genre: g }));
                          setShowGenreMenu(false);
                        }}
                        className={`block w-full text-left px-5 py-3 text-sm font-medium transition-all ${formData.genre === g ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Letra con Rich Text Editor */}
          <div className="space-y-0 border border-white/5 rounded-3xl focus-within:border-primary/50 transition-all bg-white/[0.02]">
            <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-white/10 p-4 transition-all rounded-t-3xl">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Letra y Acordes</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleManualBracket}
                      className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all border border-white/5"
                      title="Encerrar texto seleccionado en [ ] (Ctrl + Shift + B)"
                    >
                      <span className="font-mono text-primary">[ ]</span>
                      <span>Corchetes <span className="hidden md:inline text-[8px] opacity-50 ml-1">Ctrl+Shift+B</span></span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFormat}
                      className="flex items-center space-x-1.5 text-[10px] font-bold text-black bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-full transition-all shadow-lg shadow-primary/10"
                      title="Formatear automáticamente (Ctrl + Shift + F)"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C11.79,2 11.59,2.06 11.43,2.18L3.53,6.62C3.21,6.79 3,7.12 3,7.5V16.5Z" /></svg>
                      <span>Auto-Formato <span className="hidden md:inline text-[8px] opacity-70 ml-1">Ctrl+Shift+F</span></span>
                    </button>
                  </div>
                </div>

                {/* Quick Sections Chips */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                  <div className="flex-shrink-0 text-[9px] font-bold text-gray-600 uppercase tracking-widest mr-2">Secciones:</div>
                  {sections.map(section => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => insertSection(section)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 text-[10px] font-bold text-gray-400 hover:text-primary transition-all active:scale-95"
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="quill-container">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={formData.lyrics}
                onChange={handleLyricsChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Pega tu letra con acordes aquí..."
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-600 italic px-2">
            Sugerencia: Usa los botones de arriba para gestionar los corchetes [Acorde]. Solo los acordes entre corchetes se pueden transponer.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Notas para los músicos..."
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm resize-none"
            />
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
            form="song-form"
            className="px-8 py-3.5 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {initialData?.title ? 'Guardar Cambios' : 'Crear Canción'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: #141414 !important;
          padding: 8px 12px !important;
          position: sticky !important;
          top: 104px !important; /* Debajo de la cabecera sticky de secciones */
          z-index: 25 !important;
          backdrop-filter: blur(12px);
        }
        .ql-container.ql-snow {
          border: none !important;
          min-height: 300px;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          color: white !important;
          background: transparent !important;
          border-radius: 0 0 1.5rem 1.5rem !important;
        }
        .ql-editor {
          padding: 30px !important;
          line-height: 1.8 !important;
        }
        .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.2) !important;
          font-style: normal !important;
          left: 30px !important;
        }
        .ql-snow .ql-stroke {
          stroke: rgba(255, 255, 255, 0.6) !important;
        }
        .ql-snow .ql-fill {
          fill: rgba(255, 255, 255, 0.6) !important;
        }
        .ql-snow .ql-picker {
          color: rgba(255, 255, 255, 0.6) !important;
        }
        .ql-snow .ql-picker-options {
          background-color: var(--bg-card) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          z-index: 100 !important;
        }
        .ql-snow .ql-active .ql-stroke,
        .ql-snow .ql-active .ql-fill,
        .ql-snow .ql-picker-label.ql-active {
          stroke: var(--primary) !important;
          color: var(--primary) !important;
        }

        /* Estilos para que las secciones se vean como en el visor dentro del editor */
        .ql-editor span[style*="color: rgb(96, 165, 250)"] {
          border-left: 3px solid #60a5fa;
          padding-left: 10px;
          margin-top: 10px;
          display: inline-block;
          font-weight: 600 !important;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-size: 11px;
        }

        /* Asegurar que los acordes amarillos no sean TAN negritas */
        .ql-editor span[style*="color: rgb(251, 174, 0)"],
        .ql-editor strong {
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};

export default SongForm;