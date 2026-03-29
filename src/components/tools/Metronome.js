import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { extractYoutubeVideoId, getVideoDetails } from '../../utils/youtube';

const TIME_SIGNATURES = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '6/8', beats: 6 },
];

const Metronome = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const synth = useRef(null);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [detectedKey, setDetectedKey] = useState(null);
  const [detectedTitle, setDetectedTitle] = useState('');

  const getTempoLabel = (bpm) => {
    if (bpm < 60) return 'Largo';
    if (bpm < 80) return 'Adagio';
    if (bpm < 100) return 'Andante';
    if (bpm < 120) return 'Moderato';
    if (bpm < 140) return 'Allegro';
    if (bpm < 170) return 'Vivace';
    return 'Presto';
  };

  const handleYoutubeChange = async (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    const videoId = extractYoutubeVideoId(url);
    
    if (videoId) {
      setLoadingAi(true);
      setDetectedKey(null);
      setDetectedTitle('');
      try {
        const details = await getVideoDetails(videoId);
        if (details) {
          let title = details.title;
          let artist = details.channelTitle.replace(' - Topic', '');
          setDetectedTitle(`${title} - ${artist}`);

          const aiUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/ai/chat` : `/api/ai/chat`;
          const messages = [{
            role: 'user', 
            content: `Dime el BPM exacto y la tonalidad original de la canción "${title}" de "${artist}". Responde ESTRICTAMENTE con un solo objeto JSON válido en este formato: {"bpm":120, "key":"G"}. No agregues explicaciones ni Markdown (sin \`\`\`json).` 
          }];
          
          const res = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
          });
          
          const data = await res.json();
          if (data.response) {
            try {
              let jsonStr = data.response.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(jsonStr);
              if (parsed.bpm) setBpm(Number(parsed.bpm));
              if (parsed.key) setDetectedKey(parsed.key);
            } catch(e) {}
          }
        }
      } catch (err) {
        console.error("No se pudo obtener BPM");
      }
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    synth.current = new Tone.MembraneSynth().toDestination();
    
    return () => {
      Tone.Transport.stop();
      if (synth.current) synth.current.dispose();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (isPlaying) {
      Tone.start();
      let step = 0;
      
      const loop = new Tone.Loop((time) => {
        const isDownbeat = step % beatsPerMeasure === 0;
        
        if (isDownbeat) {
          synth.current.triggerAttackRelease("C3", "8n", time, 1);
        } else {
          synth.current.triggerAttackRelease("C4", "8n", time, 0.4);
        }
        
        Tone.Draw.schedule(() => {
          setCurrentBeat(step % beatsPerMeasure);
        }, time);
        
        step++;
      }, "4n");
      
      loop.start(0);
      Tone.Transport.start();
      
      return () => {
        loop.dispose();
        Tone.Transport.stop();
      };
    } else {
      Tone.Transport.stop();
      setCurrentBeat(0);
    }
  }, [isPlaying, beatsPerMeasure]);

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-[#121212] rounded-3xl border border-white/5 shadow-2xl animate-fade-in w-full max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="flex items-center space-x-3 mb-6 relative z-10 w-full">
        <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
          <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M12,1.75L8.57,2.67L4.07,19.5C4.06,19.5 4,19.84 4,20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20C20,19.84 19.94,19.5 19.93,19.5L15.43,2.67L12,1.75M10.29,4.2L12,3.74L13.71,4.2L16.13,13H7.87L10.29,4.2M12,17.5A1.5,1.5 0 0,1 13.5,19A1.5,1.5 0 0,1 12,20.5A1.5,1.5 0 0,1 10.5,19A1.5,1.5 0 0,1 12,17.5Z" /></svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Metrónomo</h2>
          <p className="text-xs text-gray-500 font-medium">{getTempoLabel(bpm)} · {beatsPerMeasure}/4</p>
        </div>
      </div>

      {/* YouTube Detection */}
      <div className="w-full relative z-10 mb-6">
        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Detectar BPM y Tono desde YouTube</label>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 24 24"><path fill="currentColor" d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z" /></svg>
          <input
            type="url"
            value={youtubeUrl}
            onChange={handleYoutubeChange}
            placeholder="Pega enlace de YouTube..."
            className="w-full pl-9 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all font-medium"
          />
          {loadingAi && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {(detectedKey || detectedTitle) && (
          <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-fade-in">
            {detectedTitle && <p className="text-xs text-gray-400 truncate mb-1">{detectedTitle}</p>}
            {detectedKey && (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-primary">Tonalidad: <span className="text-white bg-white/10 px-2 py-0.5 rounded-md ml-1">{detectedKey}</span></span>
                <span className="text-xs font-bold text-primary">BPM: <span className="text-white bg-white/10 px-2 py-0.5 rounded-md ml-1">{bpm}</span></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Beat Visualizer */}
      <div className="flex space-x-3 md:space-x-4 mb-8 relative z-10">
        {[...Array(beatsPerMeasure)].map((_, i) => (
          <div 
            key={i} 
            className={`w-5 h-5 md:w-6 md:h-6 rounded-full transition-all duration-100 ${
              isPlaying && currentBeat === i 
                ? (i === 0 ? 'bg-primary scale-125 shadow-[0_0_20px_rgba(234,179,8,0.8)]' : 'bg-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.6)]') 
                : 'bg-white/10 border border-white/10'
            }`}
          ></div>
        ))}
      </div>

      {/* BPM Display */}
      <div className="text-center w-full relative z-10">
        <div className="text-[70px] md:text-[80px] font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 leading-none mb-1">
          {bpm}
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs mb-6">BPM</p>
        
        {/* Slider */}
        <input 
          type="range" 
          min="40" 
          max="240" 
          value={bpm} 
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mb-6"
        />

        {/* Time Signature Selector */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mr-2">Compás</span>
          {TIME_SIGNATURES.map(ts => (
            <button
              key={ts.label}
              onClick={() => { setBeatsPerMeasure(ts.beats); if (isPlaying) { setIsPlaying(false); setTimeout(() => setIsPlaying(true), 100); } }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${beatsPerMeasure === ts.beats ? 'bg-primary text-black shadow-lg' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'}`}
            >
              {ts.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-5">
          <button 
            onClick={() => setBpm(b => Math.max(40, b - 1))}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold text-xl active:scale-95 transition-all border border-white/5"
          >
            −
          </button>

          <button 
            onClick={togglePlay}
            className={`flex items-center justify-center w-18 h-18 md:w-20 md:h-20 rounded-full transition-all active:scale-95 shadow-2xl ${
              isPlaying 
                ? 'bg-red-500/20 text-red-500 border-2 border-red-500/50 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
                : 'bg-primary text-black hover:bg-primary-hover shadow-[0_0_30px_rgba(234,179,8,0.3)]'
            }`}
            style={{ width: '72px', height: '72px' }}
          >
            {isPlaying ? (
              <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg>
            ) : (
              <svg className="w-9 h-9 ml-1" viewBox="0 0 24 24"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
            )}
          </button>

          <button 
            onClick={() => setBpm(b => Math.min(240, b + 1))}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold text-xl active:scale-95 transition-all border border-white/5"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default Metronome;
