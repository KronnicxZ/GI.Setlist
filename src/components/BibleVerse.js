import React, { useState, useEffect, useCallback } from 'react';
import { verses } from '../constants/verses';

// IDs específicos de API.Bible para las versiones en español solicitadas
const BIBLE_VERSIONS = {
  'Reina Valera 1960': '592420522e16049f-01',
  'Nueva Trad. Viviente': '685d140b72a2333c-01',
  'Dios Habla Hoy': '4116ea77a943a537-01',
  'Nueva Versión Int.': 'c61ead81cd1e82c1-01',
  'Traducción Lenguaje Actual': '300732890471b694-01'
};

// Mapa de nombres de libros a IDs de la API (Abreviaturas estándar)
const BOOK_MAP = {
  'Salmos': 'PSA',
  'Colosenses': 'COL',
  'Efesios': 'EPH',
  'Santiago': 'JAS',
  'Hebreos': 'HEB',
  '1 Crónicas': '1CH',
  '2 Crónicas': '2CH',
  'Isaías': 'ISA',
  'Jeremías': 'JER',
  'Apocalipsis': 'REV'
};

const BibleVerse = ({ isCollapsed }) => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('Reina Valera 1960');
  const [showVersionMenu, setShowVersionMenu] = useState(false);

  const fetchRandomVerse = useCallback(async (versionName = selectedVersion) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener referencia aleatoria de nuestra lista
      const randomEntry = verses[Math.floor(Math.random() * verses.length)];

      // 2. Parsear la referencia para el formato de API.Bible (ej: PSA.95.1)
      // Nota: Para rangos como "95:1-2", simplificamos al primer versículo para la API
      const refParts = randomEntry.reference.match(/(.+)\s+(\d+):(\d+)/);
      let apiRef = "";

      if (refParts) {
        const bookName = refParts[1];
        const chapter = refParts[2];
        const verseNum = refParts[3];
        const bookId = BOOK_MAP[bookName] || 'PSA'; // Default to Psalms if book not found
        apiRef = `${bookId}.${chapter}.${verseNum}`;
      } else {
        apiRef = 'PSA.100.1'; // Fallback if reference format is unexpected
      }

      const bibleId = BIBLE_VERSIONS[versionName];
      const apiKey = process.env.REACT_APP_BIBLE_API_KEY;

      if (!apiKey) {
        throw new Error('API Key for Bible API is not defined in .env');
      }

      const response = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${apiRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`,
        {
          headers: { 'api-key': apiKey }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al conectar con la API Bíblica: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      setVerse({
        reference: data.data.reference,
        verse: data.data.content,
        version: versionName
      });
    } catch (err) {
      console.error('Bible API Error:', err);
      // Fallback a datos locales
      const localVerse = verses[Math.floor(Math.random() * verses.length)];
      setVerse({
        ...localVerse,
        version: 'Offline'
      });
      setError('Modo offline');
    } finally {
      setLoading(false);
    }
  }, [selectedVersion]);

  useEffect(() => {
    fetchRandomVerse();
  }, []);

  // Removed the useEffect that reloads on selectedVersion change,
  // as the button click handler now explicitly calls fetchRandomVerse(v).
  // useEffect(() => {
  //   if (verse) fetchRandomVerse(selectedVersion);
  // }, [selectedVersion]);

  const handleRefreshClick = (e) => {
    e.stopPropagation();
    fetchRandomVerse();
  };

  const handleIconClick = (e) => {
    // Si el sidebar está colapsado, permitimos que el click se propague
    // para que el contenedor del sidebar capture el evento y se expanda.
    if (!isCollapsed) {
      e.stopPropagation();
      fetchRandomVerse();
    }
  };

  if (loading && !verse) {
    return (
      <div className={`flex items-center justify-center p-4 ${isCollapsed ? '' : 'min-h-[100px]'}`}>
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!verse) return null;

  const VerseContent = () => (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Palabra de hoy</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleRefreshClick}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Siguiente versículo"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
              <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowVersionMenu(!showVersionMenu); }}
              className="px-2 py-1 flex items-center space-x-1 text-[9px] font-bold text-gray-500 hover:text-white bg-white/5 rounded-md border border-white/5 hover:border-white/10 transition-all uppercase"
            >
              <span>{selectedVersion === 'Reina Valera 1960' ? 'RVR1960' : selectedVersion === 'Nueva Trad. Viviente' ? 'NTV' : selectedVersion === 'Dios Habla Hoy' ? 'DHH' : selectedVersion === 'Nueva Versión Int.' ? 'NVI' : 'TLA'}</span>
              <svg className={`w-3 h-3 transition-transform ${showVersionMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24"><path fill="currentColor" d="M7,10L12,15L17,10H7Z" /></svg>
            </button>

            {showVersionMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-card border border-white/10 rounded-sub shadow-2xl py-1 z-[200] animate-fade-in glass">
                {Object.keys(BIBLE_VERSIONS).map((v) => (
                  <button
                    key={v}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVersion(v);
                      setShowVersionMenu(false);
                      fetchRandomVerse(v);
                    }}
                    className={`block w-full text-left px-3 py-2 text-[10px] font-bold transition-all ${selectedVersion === v ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative group/text">
        <p className="text-[13px] text-gray-300 font-medium italic leading-relaxed line-clamp-4 group-hover/text:line-clamp-none transition-all duration-500">
          "{verse.verse.trim().replace(/^"|"$/g, '')}"
        </p>
        <div className="mt-3 flex items-center space-x-2">
          <div className="h-[1px] w-4 bg-primary/30"></div>
          <p className="text-[11px] font-black text-primary tracking-widest uppercase">
            {verse.reference}
          </p>
        </div>
        {error && <span className="absolute -bottom-4 right-0 text-[8px] text-gray-600 font-bold uppercase tracking-tighter">{error}</span>}
      </div>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="py-6 border-t border-white/5 mt-auto flex justify-center w-full">
        <div className="relative group/verse">
          <button
            onClick={handleIconClick}
            className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
            title="Palabra de hoy"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>

          <div className="absolute left-full ml-4 bottom-0 w-72 p-5 bg-card border border-white/10 rounded-sub shadow-2xl z-[200] opacity-0 translate-x-2 pointer-events-none group-hover/verse:opacity-100 group-hover/verse:translate-x-0 group-hover/verse:pointer-events-auto transition-all duration-300 glass text-left">
            <VerseContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 border-t border-white/5 mt-auto">
      <VerseContent />
    </div>
  );
};

export default BibleVerse;