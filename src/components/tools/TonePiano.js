import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const TonePiano = () => {
  const [activeNote, setActiveNote] = useState(null);
  const synth = useRef(null);

  const notes = [
    { key: 'C', label: 'Do' },
    { key: 'C#', label: 'Do#' },
    { key: 'D', label: 'Re' },
    { key: 'D#', label: 'Re#' },
    { key: 'E', label: 'Mi' },
    { key: 'F', label: 'Fa' },
    { key: 'F#', label: 'Fa#' },
    { key: 'G', label: 'Sol' },
    { key: 'G#', label: 'Sol#' },
    { key: 'A', label: 'La' },
    { key: 'A#', label: 'La#' },
    { key: 'B', label: 'Si' }
  ];

  useEffect(() => {
    synth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 1
      }
    }).toDestination();
    
    return () => {
      if (synth.current) synth.current.dispose();
    };
  }, []);

  const playNote = async (note) => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    
    setActiveNote(note);
    synth.current.triggerAttackRelease(`${note}4`, '0.5s');
    
    setTimeout(() => {
      setActiveNote(null);
    }, 500);
  };

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-main border border-white/5 p-8 max-w-2xl mx-auto shadow-2xl">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/20">
          <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M12,14A1,1 0 0,0 13,13A1,1 0 0,0 12,12A1,1 0 0,0 11,13A1,1 0 0,0 12,14M12,1A7,7 0 0,0 5,8V13A1,1 0 0,0 4,14V17A1,1 0 0,0 5,18V19A3,3 0 0,0 8,22H16A3,3 0 0,0 19,19V18A1,1 0 0,0 20,17V14A1,1 0 0,0 19,13V8A7,7 0 0,0 12,1M14,20H12A2,2 0 0,1 10,18V17H14V18A2,2 0 0,1 12,20M17,14V16H7V14H17M17,11.23V13H7V11.23C7,11.08 7.03,10.94 7.05,10.82L7.38,8.27C7.62,6.43 9.17,5 11,5H13C14.83,5 16.38,6.43 16.62,8.27L16.95,10.82C16.97,10.94 17,11.08 17,11.23Z" /></svg>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Referencia de Tonos</h2>
        <p className="text-gray-500 text-sm font-medium text-center max-w-sm">Escucha el tono inicial perfecto para tu banda seleccionando una nota.</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {notes.map((n) => (
          <button
            key={n.key}
            onClick={() => playNote(n.key)}
            className={`flex flex-col items-center justify-center py-6 rounded-2xl border transition-all active:scale-95 ${
              activeNote === n.key 
                ? 'bg-primary border-primary shadow-[0_0_20px_rgba(251,174,0,0.4)] text-black' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary shadow-lg'
            }`}
          >
            <span className="text-xl font-black mb-1 leading-none">{n.key}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeNote === n.key ? 'text-black/60' : 'text-gray-600'}`}>{n.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center space-x-4 px-6 py-4 bg-primary/5 rounded-sub border border-primary/10">
        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>
        <p className="text-xs text-primary font-bold">Esta herramienta ayuda a calibrar el tono vocal antes de iniciar.</p>
      </div>
    </div>
  );
};

export default TonePiano;
