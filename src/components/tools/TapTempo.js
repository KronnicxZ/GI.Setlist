import React, { useState, useEffect, useRef } from 'react';

const TapTempo = () => {
  const [taps, setTaps] = useState([]);
  const [bpm, setBpm] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    let newTaps = [...taps, now];
    
    if (newTaps.length > 1) {
      const timeDiffMs = newTaps[newTaps.length - 1] - newTaps[0];
      const avgTimePerTap = timeDiffMs / (newTaps.length - 1);
      const calculatedBpm = Math.round(60000 / avgTimePerTap);
      setBpm(calculatedBpm);
    }
    
    // Keep max 8 taps for smoother average
    if (newTaps.length > 8) {
      newTaps.shift();
    }
    
    setTaps(newTaps);
    setTapCount(prev => prev + 1);
    
    // Pulse animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
  };

  // Reset taps after 2.5 seconds of inactivity
  useEffect(() => {
    if (taps.length > 0) {
      const timer = setTimeout(() => {
        setTaps([]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [taps]);

  // Use ref-based callback for keyboard handler to avoid stale closures
  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;

  // Keyboard support: spacebar to tap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleTapRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetBpm = () => {
    setTaps([]);
    setBpm(0);
    setTapCount(0);
  };

  const getTempoLabel = (bpm) => {
    if (bpm === 0) return '---';
    if (bpm < 60) return 'Largo';
    if (bpm < 80) return 'Adagio';
    if (bpm < 100) return 'Andante';
    if (bpm < 120) return 'Moderato';
    if (bpm < 140) return 'Allegro';
    if (bpm < 170) return 'Vivace';
    return 'Presto';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-2xl animate-fade-in w-full max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="flex items-center space-x-3 mb-6 w-full relative z-10">
        <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M13,2.05V4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03V2.05M5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37L5.67,19.74M7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06C9.05,2.25 7.19,3 5.67,4.26L7.1,5.74M5.69,7.1L4.26,5.67C3,7.19 2.25,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1M4.06,13H2.06C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13M10,16.5L16,12L10,7.5V16.5Z" /></svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Tap Tempo</h2>
          <p className="text-xs text-gray-500 font-medium">Toca al ritmo · Tecla Espacio</p>
        </div>
      </div>

      <div className="text-center w-full relative z-10">
        {/* BPM Display */}
        <div className="mb-2">
          <div className={`text-[80px] md:text-[100px] font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-none transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
            {bpm > 0 ? bpm : '--'}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-1">
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">BPM</p>
            {bpm > 0 && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20 animate-fade-in">
                {getTempoLabel(bpm)}
              </span>
            )}
          </div>
        </div>

        {/* Tap count indicator */}
        {tapCount > 0 && (
          <div className="flex items-center justify-center space-x-1.5 mb-6 animate-fade-in">
            {[...Array(Math.min(tapCount, 8))].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-500/60 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}></div>
            ))}
          </div>
        )}
        
        {/* Tap Button */}
        <button 
          onClick={handleTap}
          className={`w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)] active:scale-90 transition-all duration-100 flex items-center justify-center flex-col mx-auto cursor-pointer select-none ${isAnimating ? 'bg-green-500 text-black scale-95' : 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black'}`}
        >
          <span className="text-3xl font-black uppercase tracking-widest mb-1">TAP</span>
          <span className="text-[10px] font-bold opacity-70 tracking-wide uppercase">Espacio / Click</span>
        </button>

        {bpm > 0 && (
          <button 
            onClick={resetBpm}
            className="mt-8 px-6 py-2 rounded-full border border-white/10 text-gray-500 hover:bg-white/5 hover:text-white transition-all text-xs font-bold uppercase tracking-wider mx-auto block"
          >
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
};

export default TapTempo;
