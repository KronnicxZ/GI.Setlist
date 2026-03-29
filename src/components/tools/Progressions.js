import React, { useState } from 'react';

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const transposeChordInKey = (chord, rootIndex) => {
  const match = chord.match(/^([A-G])([#b]?)(.*)/);
  if (!match) return chord;
  const [, note, accidental, quality] = match;
  const notesFull = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const notesFlatLookup = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  let idx = notesFull.indexOf(note + accidental);
  if (idx === -1) idx = notesFlatLookup.indexOf(note + accidental);
  if (idx === -1) return chord;
  const newIndex = (idx + rootIndex) % 12;
  return NOTES_SHARP[newIndex] + quality;
};

const progressions = [
  {
    name: "La Clásica del Pop",
    roman: ["I", "V", "vi", "IV"],
    baseChords: ["C", "G", "Am", "F"],
    description: "La progresión más usada en la música popular y de adoración. Usada en canciones como 'Let It Be' y 'Oceans'.",
    mood: "Épico / Resolutivo",
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30'
  },
  {
    name: "Emoción Creciente",
    roman: ["vi", "IV", "I", "V"],
    baseChords: ["Am", "F", "C", "G"],
    description: "Muy común en coros intensos y bridges modernos. Usada en 'Reckless Love' y muchas baladas.",
    mood: "Melancólico → Triunfante",
    color: 'from-blue-500/20 to-purple-500/20',
    border: 'border-blue-500/30'
  },
  {
    name: "Alabanza Alegre",
    roman: ["I", "IV", "V", "IV"],
    baseChords: ["C", "F", "G", "F"],
    description: "Para ritmos rápidos, júbilo y celebración. Perfecta para alabanza rítmica y danza.",
    mood: "Alegre / Movido",
    color: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30'
  },
  {
    name: "El Clamor (Worship)",
    roman: ["IV", "I", "V", "vi"],
    baseChords: ["F", "C", "G", "Am"],
    description: "Inicia en la subdominante, creando tensión y anhelo. Muy usada en Hillsong y Bethel.",
    mood: "Clamor / Tensión",
    color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30'
  },
  {
    name: "Jazz / Gospel",
    roman: ["ii", "V", "I"],
    baseChords: ["Dm", "G", "C"],
    description: "La base de modulaciones y progresiones ricas armónicamente. Esencial para gospel.",
    mood: "Sofisticado",
    color: 'from-cyan-500/20 to-teal-500/20',
    border: 'border-cyan-500/30'
  },
  {
    name: "Canon de Pachelbel",
    roman: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
    baseChords: ["C", "G", "Am", "Em", "F", "C", "F", "G"],
    description: "La progresión del Canon en Re. Base de incontables canciones de boda y worship.",
    mood: "Majestuoso",
    color: 'from-rose-500/20 to-red-500/20',
    border: 'border-rose-500/30'
  }
];

const Progressions = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedKeyOffset, setSelectedKeyOffset] = useState(0);

  const transposeChords = (baseChords) => {
    if (selectedKeyOffset === 0) return baseChords;
    return baseChords.map(chord => transposeChordInKey(chord, selectedKeyOffset));
  };

  return (
    <div className="flex flex-col items-center justify-center p-5 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-2xl animate-fade-in w-full max-w-2xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="flex items-center justify-between w-full relative z-10 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Progresiones</h2>
            <p className="text-xs text-gray-500 font-medium">Progresiones armónicas populares</p>
          </div>
        </div>
      </div>

      {/* Key Selector */}
      <div className="w-full relative z-10 mb-6">
        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Transponer a tonalidad</label>
        <div className="flex flex-wrap gap-1.5">
          {NOTES_SHARP.map((note, i) => (
            <button
              key={note}
              onClick={() => setSelectedKeyOffset(i)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedKeyOffset === i ? 'bg-primary text-black shadow-lg' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white'}`}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full relative z-10 space-y-3">
        {progressions.map((prog, index) => {
          const isActive = activeIndex === index;
          const transposed = transposeChords(prog.baseChords);
          
          return (
            <div 
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`p-4 md:p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${isActive ? `bg-gradient-to-r ${prog.color} ${prog.border} shadow-lg` : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold text-base md:text-lg ${isActive ? 'text-white' : 'text-gray-300'}`}>{prog.name}</h3>
                <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border ${isActive ? 'text-white bg-white/10 border-white/20' : 'text-gray-500 bg-black/50 border-white/10'}`}>{prog.mood}</span>
              </div>
              
              {/* Roman Numerals */}
              <div className="flex gap-2 mb-2">
                {prog.roman.map((numeral, i) => (
                  <div key={i} className={`flex-1 flex items-center justify-center py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm ${isActive ? 'bg-black/30 text-white/80 border border-white/10' : 'bg-black/20 text-gray-500 border border-white/5'}`}>
                    {numeral}
                  </div>
                ))}
              </div>

              {/* Transposed Chords */}
              <div className="flex gap-2 mb-2">
                {transposed.map((chord, i) => (
                  <div key={i} className={`flex-1 flex items-center justify-center py-2 md:py-2.5 rounded-lg font-black text-sm md:text-base shadow-inner ${isActive ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                    {chord}
                  </div>
                ))}
              </div>

              {isActive && (
                <div className="pt-3 border-t border-white/10 mt-2 text-xs md:text-sm text-gray-400 animate-fade-in leading-relaxed">
                  {prog.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Progressions;
