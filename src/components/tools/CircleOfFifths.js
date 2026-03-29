import React, { useState } from 'react';

const keysInfo = [
  { major: 'C', minor: 'Am', sig: '0', angle: 0 },
  { major: 'G', minor: 'Em', sig: '1♯', angle: 30 },
  { major: 'D', minor: 'Bm', sig: '2♯', angle: 60 },
  { major: 'A', minor: 'F♯m', sig: '3♯', angle: 90 },
  { major: 'E', minor: 'C♯m', sig: '4♯', angle: 120 },
  { major: 'B', minor: 'G♯m', sig: '5♯', angle: 150 },
  { major: 'F♯/G♭', minor: 'D♯m/E♭m', sig: '6♯/6♭', angle: 180 },
  { major: 'D♭', minor: 'B♭m', sig: '5♭', angle: 210 },
  { major: 'A♭', minor: 'Fm', sig: '4♭', angle: 240 },
  { major: 'E♭', minor: 'Cm', sig: '3♭', angle: 270 },
  { major: 'B♭', minor: 'Gm', sig: '2♭', angle: 300 },
  { major: 'F', minor: 'Dm', sig: '1♭', angle: 330 },
];

// Common chords in each key (I, ii, iii, IV, V, vi, vii°)
const getChordsInKey = (keyIndex) => {
  const intervals = [0, 2, 4, 5, 7, 9, 11];
  const qualities = ['', 'm', 'm', '', '', 'm', 'dim'];
  const numerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  
  const key = keysInfo[keyIndex];
  const rootNote = key.major.split('/')[0].replace('♯','#').replace('♭','b');
  
  const NOTES_LOOKUP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NOTES_FLAT = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
  const NOTES_SHARP = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  
  let rootIndex = NOTES_LOOKUP.indexOf(rootNote);
  if (rootIndex === -1) {
    const flatLookup = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
    rootIndex = flatLookup.indexOf(rootNote);
  }
  if (rootIndex === -1) rootIndex = 0;
  
  const useFlats = key.sig.includes('♭');
  const noteNames = useFlats ? NOTES_FLAT : NOTES_SHARP;
  
  return intervals.map((interval, i) => ({
    note: noteNames[(rootIndex + interval) % 12] + qualities[i],
    numeral: numerals[i]
  }));
};

const CircleOfFifths = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedKey = keysInfo[selectedIndex];
  const chordsInKey = getChordsInKey(selectedIndex);

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-2xl animate-fade-in w-full max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -ml-20 -mt-20"></div>
      
      <div className="flex items-center space-x-3 mb-6 w-full relative z-10">
        <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Círculo de Quintas</h2>
          <p className="text-xs text-gray-500 font-medium">Toca una tonalidad para ver detalles</p>
        </div>
      </div>

      {/* Circle */}
      <div className="w-full relative z-10 mt-2 mb-8 flex justify-center">
        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border-2 border-white/10" style={{ boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)' }}>
          {keysInfo.map((info, index) => {
            const rad = (info.angle - 90) * (Math.PI / 180);
            const x = 50 + 40 * Math.cos(rad);
            const y = 50 + 40 * Math.sin(rad);
            
            const isSelected = selectedIndex === index;

            return (
              <div
                key={info.major}
                onClick={() => setSelectedIndex(index)}
                className={`absolute w-11 h-11 md:w-12 md:h-12 -ml-[22px] -mt-[22px] md:-ml-6 md:-mt-6 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-primary text-black scale-125 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-20 font-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white z-10 font-bold border border-white/10'}`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span className="text-xs md:text-sm leading-none">{info.major.split('/')[0]}</span>
                <span className={`text-[7px] md:text-[8px] mt-0.5 ${isSelected ? 'text-black/70' : 'text-gray-500'}`}>{info.minor.split('/')[0]}</span>
              </div>
            );
          })}
          {/* Center info */}
          <div className="absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center shadow-inner text-center p-2">
             <span className="text-primary font-bold text-xl md:text-2xl">{selectedKey.major.split('/')[0]}</span>
             <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Relativa</span>
             <span className="text-white font-bold text-sm">{selectedKey.minor.split('/')[0]}</span>
             <span className="text-[9px] bg-white/10 px-2 py-0.5 mt-1.5 rounded-full font-bold text-gray-400 border border-white/5">{selectedKey.sig}</span>
          </div>
        </div>
      </div>

      {/* Key relationships */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
         <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10 flex flex-col items-center text-center">
             <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Subdominante (IV)</span>
             <span className="text-lg md:text-xl font-black text-white">{keysInfo[(selectedIndex + 11) % 12].major.split('/')[0]}</span>
         </div>
         <div className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10 flex flex-col items-center text-center">
             <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-1">Dominante (V)</span>
             <span className="text-lg md:text-xl font-black text-primary drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">{keysInfo[(selectedIndex + 1) % 12].major.split('/')[0]}</span>
         </div>
      </div>

      {/* Chords in Key */}
      <div className="w-full">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Acordes en {selectedKey.major.split('/')[0]} Mayor</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {chordsInKey.map((chord, i) => (
            <div key={i} className={`flex flex-col items-center p-1.5 md:p-2 rounded-lg border transition-all ${i === 0 ? 'bg-primary/15 border-primary/30' : i === 3 || i === 4 ? 'bg-white/8 border-white/15' : 'bg-white/5 border-white/5'}`}>
              <span className={`text-[9px] md:text-[10px] font-bold mb-0.5 ${i === 0 ? 'text-primary' : 'text-gray-500'}`}>{chord.numeral}</span>
              <span className="text-[10px] md:text-xs font-bold text-white leading-tight text-center">{chord.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CircleOfFifths;
