import React, { useState } from 'react';

const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteIndex = (note) => {
  let index = NOTES_SHARP.indexOf(note);
  if (index === -1) index = NOTES_FLAT.indexOf(note);
  return index;
};

const transposeNote = (note, semitones) => {
  const isFlat = note.includes('b');
  const index = getNoteIndex(note);
  if (index === -1) return note;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  return isFlat ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
};

const transposeText = (text, semitones) => {
  if (semitones === 0) return text;
  
  return text.replace(/\[([A-G][b#]?)([^\]/]*)(\/[A-G][b#]?)?\]/g, (match, root, quality, bass) => {
    const newRoot = transposeNote(root, semitones);
    let newBass = '';
    if (bass) {
      const bassNote = bass.substring(1);
      newBass = '/' + transposeNote(bassNote, semitones);
    }
    return `[${newRoot}${quality}${newBass}]`;
  });
};

const Transposer = () => {
  const [text, setText] = useState('');
  const [semitonesLevel, setSemitonesLevel] = useState(0);
  const [copied, setCopied] = useState(false);

  const shift = (amount) => {
    const newLevel = semitonesLevel + amount;
    setSemitonesLevel(newLevel);
    setText(prevText => transposeText(prevText, amount));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (semitonesLevel !== 0) {
      setText(prevText => transposeText(prevText, -semitonesLevel));
      setSemitonesLevel(0);
    }
  };

  // Count chords in text
  const chordCount = (text.match(/\[[A-G]/g) || []).length;

  return (
    <div className="flex flex-col items-center justify-center p-5 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-2xl animate-fade-in w-full max-w-2xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="flex items-center space-x-3 mb-6 w-full relative z-10">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z" /></svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Transponer</h2>
          <p className="text-xs text-gray-500 font-medium">Pega letra con acordes entre [corchetes]</p>
        </div>
      </div>

      <div className="w-full relative z-10 flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
          <div className="flex items-center space-x-3">
            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Semitonos:</span>
            <span className={`text-lg font-black tabular-nums min-w-[40px] text-center ${semitonesLevel > 0 ? 'text-green-400' : semitonesLevel < 0 ? 'text-red-400' : 'text-white'}`}>
              {semitonesLevel > 0 ? `+${semitonesLevel}` : semitonesLevel}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => shift(-1)}
              className="w-10 h-10 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold text-lg active:scale-95 transition-all border border-white/5"
            >
              −
            </button>
            <button
              onClick={handleReset}
              className="px-3 h-10 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white text-xs font-bold active:scale-95 transition-all border border-white/5"
            >
              Reset
            </button>
            <button 
              onClick={() => shift(1)}
              className="w-10 h-10 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 flex items-center justify-center font-bold text-lg active:scale-95 transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick transpose buttons */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => shift(n)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all active:scale-95 ${n > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'}`}
            >
              {n > 0 ? `+${n}` : n}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSemitonesLevel(0); }}
            placeholder="Ejemplo:&#10;[VERSO]&#10;[G]Cuan grande es [C]Él&#10;[D]Cuando miro al [G]cielo..."
            className="w-full h-56 md:h-64 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 font-mono text-sm resize-none custom-scrollbar shadow-inner"
          ></textarea>
          {chordCount > 0 && (
            <div className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-500 bg-black/80 px-2 py-0.5 rounded-md">
              {chordCount} acordes
            </div>
          )}
        </div>

        {/* Copy button */}
        <button 
          onClick={handleCopy}
          disabled={!text.trim()}
          className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] border flex items-center justify-center space-x-2 ${copied ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 disabled:opacity-30'}`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>
              <span>Copiar Todo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Transposer;
