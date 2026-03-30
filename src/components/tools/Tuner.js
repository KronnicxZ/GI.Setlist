import React, { useState, useEffect, useRef } from 'react';

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteStringsEs = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

function getNoteFromPitch(frequency) {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}

function getFrequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function getCentsOffFromPitch(frequency, note) {
  return Math.floor(1200 * Math.log(frequency / getFrequencyFromNoteNumber(note)) / Math.log(2));
}

function autoCorrelate(buf, sampleRate) {
  let SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;

  let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  let a = (x1 + x3 - 2 * x2) / 2;
  let b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

// Standard tuning reference
const TUNING_REFS = [
  { note: 'E2', freq: 82.41, string: '6ª' },
  { note: 'A2', freq: 110.00, string: '5ª' },
  { note: 'D3', freq: 146.83, string: '4ª' },
  { note: 'G3', freq: 196.00, string: '3ª' },
  { note: 'B3', freq: 246.94, string: '2ª' },
  { note: 'E4', freq: 329.63, string: '1ª' },
];

const Tuner = () => {
  const [isActive, setIsActive] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState(null);
  const [cents, setCents] = useState(0);
  const [error, setError] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamSourceRef = useRef(null);
  const rafIdRef = useRef(null);
  const streamRef = useRef(null);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, echoCancellation: false });
      streamRef.current = stream;
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      // Filto de ruido para mejorar precisión (Low pass)
      const biquadFilter = audioContextRef.current.createBiquadFilter();
      biquadFilter.type = "lowpass";
      biquadFilter.frequency.setValueAtTime(1000, audioContextRef.current.currentTime);
      biquadFilter.Q.setValueAtTime(1, audioContextRef.current.currentTime);

      mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      mediaStreamSourceRef.current.connect(biquadFilter);
      biquadFilter.connect(analyserRef.current);
      
      setIsActive(true);
      setError(null);
      updatePitch();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Debes permitir el acceso al micrófono para usar el afinador.');
    }
  };

  const stopTuner = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
    setPitch(null);
    setNote(null);
    setCents(0);
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  const updatePitch = () => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const ac = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (ac !== -1) {
      setPitch(ac);
      const noteNum = getNoteFromPitch(ac);
      setNote(noteNum);
      const centDiff = getCentsOffFromPitch(ac, noteNum);
      setCents(centDiff);
    }

    rafIdRef.current = requestAnimationFrame(updatePitch);
  };

  const isTuned = Math.abs(cents) < 10;
  const noteName = note !== null ? noteStrings[note % 12] : '--';
  const esNoteName = note !== null ? noteStringsEs[note % 12] : '';
  const octave = note !== null ? Math.floor(note / 12) - 1 : '';

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="flex items-center space-x-3 mb-6 w-full">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" /></svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Afinador</h2>
          <p className="text-xs text-gray-500 font-medium">{isActive ? (isTuned ? '✓ Afinado' : 'Escuchando...') : 'Usa el micrófono de tu dispositivo'}</p>
        </div>
      </div>

      {error ? (
        <div className="text-red-400 mb-6 bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-center w-full text-sm">
          {error}
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          {isActive ? (
            <div className={`relative flex flex-col items-center justify-center w-52 h-52 md:w-64 md:h-64 rounded-full border-4 transition-all duration-300 shadow-xl mb-6 ${isTuned ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : cents > 0 ? 'border-orange-500/50 bg-orange-500/5' : cents < 0 ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5'}`}>
              <div className={`text-6xl md:text-7xl font-black tracking-tighter ${isTuned ? 'text-green-400' : 'text-white'}`}>
                {noteName}
              </div>
              <div className="text-gray-400 font-medium uppercase tracking-[0.2em] mt-1 text-xs md:text-sm">
                {esNoteName}{octave !== '' ? ` (${octave})` : ''}
              </div>
              
              {pitch && (
                <div className="text-[10px] text-gray-500 absolute bottom-5 font-mono">
                  {pitch.toFixed(1)} Hz
                </div>
              )}

              {/* Needle */}
              <div 
                className={`absolute top-2 w-0.5 h-24 md:h-28 origin-bottom transition-transform duration-200 ease-out ${isTuned ? 'bg-green-500' : 'bg-white/60'}`}
                style={{ transform: `rotate(${Math.max(-45, Math.min(45, cents * 1.2))}deg)` }}
              >
                <div className={`w-2.5 h-2.5 rounded-full -ml-1 -mt-1 ${isTuned ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-white'}`}></div>
              </div>
            </div>
          ) : (
            <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border-4 border-white/5 bg-white/[0.02] flex flex-col items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-600 mb-2" viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" /></svg>
              <span className="text-gray-500 font-medium text-sm">Micrófono inactivo</span>
            </div>
          )}

          {/* Cents Meter */}
          {isActive && (
            <div className="w-full mb-6">
              <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-1.5">
                <span>♭ Bemol</span>
                <span className={isTuned ? 'text-green-400' : ''}>Centro</span>
                <span>♯ Sostenido</span>
              </div>
              <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden relative border border-white/10">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -ml-[0.25px]"></div>
                {/* Green zone indicator */}
                <div className="absolute left-[45%] w-[10%] top-0 bottom-0 bg-green-500/10"></div>
                <div 
                  className={`absolute h-full rounded-full transition-all duration-150 ${isTuned ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]' : 'bg-red-500'}`}
                  style={{ 
                    width: '8px', 
                    left: `calc(50% + ${Math.max(-48, Math.min(48, cents))}%)`,
                    transform: 'translateX(-50%)'
                  }}
                ></div>
              </div>
              <div className="text-center mt-2">
                <span className={`text-xl font-black ${isTuned ? 'text-green-400' : 'text-white'}`}>
                  {cents > 0 ? `+${cents}` : cents}
                </span>
                <span className="text-[10px] font-medium text-gray-500 tracking-wider ml-1.5">CENTS</span>
              </div>
            </div>
          )}

          {/* Guitar strings reference */}
          {isActive && (
            <div className="w-full mb-6">
              <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Afinación Estándar</h4>
              <div className="grid grid-cols-6 gap-1">
                {TUNING_REFS.map((ref, i) => {
                  const isClosest = note !== null && noteStrings[note % 12] === ref.note.replace(/[0-9]/g, '');
                  return (
                    <div key={i} className={`flex flex-col items-center p-1.5 rounded-lg border transition-all ${isClosest && isTuned ? 'bg-green-500/15 border-green-500/30' : isClosest ? 'bg-white/10 border-white/20' : 'bg-white/[0.03] border-white/5'}`}>
                      <span className="text-[9px] text-gray-500 font-bold">{ref.string}</span>
                      <span className={`text-xs font-bold ${isClosest ? (isTuned ? 'text-green-400' : 'text-white') : 'text-gray-500'}`}>{ref.note}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button 
            onClick={isActive ? stopTuner : startTuner}
            className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98] ${isActive ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'}`}
          >
            {isActive ? '■  Detener' : '● Activar Afinador'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Tuner;
