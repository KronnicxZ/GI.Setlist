import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import parse from 'html-react-parser';
import * as Popover from '@radix-ui/react-popover';
import Chord from '@tombatossals/react-chords/lib/Chord';
import guitarDb from '@tombatossals/chords-db/lib/guitar.json';
import { transposeText, formatLyricsForDisplay, NOTES } from '../utils/chordTransposer';
import { useAuth } from '../context/AuthContext';

const PlayerModal = ({ song, onClose }) => {
  const { isAdmin } = useAuth();
  const [semitones, setSemitones] = useState(0);
  const [transposedLyrics, setTransposedLyrics] = useState(song?.lyrics || '');

  // Metronome State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(Number(song?.bpm) || 120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const synth = useRef(null);
  const repeatId = useRef(null);
  const beatCounter = useRef(0);

  useEffect(() => {
    if (song?.lyrics) {
      const transposed = transposeText(song.lyrics, semitones);
      const formatted = formatLyricsForDisplay(transposed);
      setTransposedLyrics(formatted);
    }
  }, [song, semitones]);

  useEffect(() => {
    setBpm(Number(song?.bpm) || 120);
  }, [song]);

  // Metronome Sound Setup (One-time)
  useEffect(() => {
    synth.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: {
        attack: 0.0001,
        decay: 0.2,
        sustain: 0
      }
    }).toDestination();

    return () => {
      if (synth.current) synth.current.dispose();
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    };
  }, []);

  // Update BPM in real-time without stopping
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  // Metronome Logic - Control Start/Stop and measure changes
  useEffect(() => {
    if (isPlaying) {
      const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);

      // Clear previous repeat if exists to handle time signature changes
      if (repeatId.current !== null) {
        Tone.getTransport().clear(repeatId.current);
      }

      repeatId.current = Tone.getTransport().scheduleRepeat((time) => {
        const beat = beatCounter.current;

        // 1. Sound Logic
        if (beat === 0) {
          synth.current.triggerAttackRelease("C4", "32n", time, 1.0);
        } else {
          synth.current.triggerAttackRelease("G3", "32n", time, 0.4);
        }

        // 2. UI Sync
        Tone.Draw.schedule(() => {
          setCurrentBeat(beat);
        }, time);

        // 3. Increment counter
        beatCounter.current = (beat + 1) % beatsPerMeasure;
      }, "4n");

      if (Tone.getTransport().state !== "started") {
        Tone.getTransport().start("+0.05");
      }
    } else {
      if (repeatId.current !== null) {
        Tone.getTransport().clear(repeatId.current);
        repeatId.current = null;
      }
      Tone.getTransport().stop();
      setCurrentBeat(0);
      beatCounter.current = 0;
    }
  }, [isPlaying, timeSignature]);

  const toggleMetronome = async () => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    setIsPlaying(!isPlaying);
  };

  // Helper to find chord data in DB
  const getChordData = (chordName) => {
    if (!chordName) return null;

    // Remove brackets if they exist
    const cleanName = chordName.replace('[', '').replace(']', '');

    // Split into base and suffix
    const match = cleanName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return null;

    const [, base, suffix] = match;

    const keyMap = {
      'C': 'C', 'C#': 'Csharp', 'Db': 'Csharp',
      'D': 'D', 'D#': 'Eb', 'Eb': 'Eb',
      'E': 'E',
      'F': 'F', 'F#': 'Fsharp', 'Gb': 'Fsharp',
      'G': 'G', 'G#': 'Ab', 'Ab': 'Ab',
      'A': 'A', 'A#': 'Bb', 'Bb': 'Bb',
      'B': 'B'
    };

    const mappedKey = keyMap[base];
    if (!mappedKey) return null;

    const suffixMap = {
      '': 'major',
      'm': 'minor',
      '7': '7',
      'm7': 'minor7',
      'maj7': 'maj7',
      'sus2': 'sus2',
      'sus4': 'sus4',
      'add9': 'add9',
      'dim': 'diminished',
      'aug': 'augmented',
      '6': '6',
      '9': '9',
      '11': '11',
      '13': '13'
    };

    let mappedSuffix = suffixMap[suffix] || suffix;

    const keyData = guitarDb.chords[mappedKey];
    if (!keyData) return null;

    let chordInfo = keyData.find(c => c.suffix === mappedSuffix);

    if (!chordInfo && suffix.startsWith('m')) {
      chordInfo = keyData.find(c => c.suffix === 'minor');
    }

    return chordInfo ? chordInfo.positions[0] : null;
  };

  // Lyrics rendering with tooltips
  const renderLyrics = () => {
    if (!transposedLyrics) return <p className="text-gray-600 italic">No hay letra disponible para esta canción.</p>;

    const options = {
      replace: (domNode) => {
        if (domNode.attribs && domNode.attribs.class === 'chord') {
          const chordName = domNode.children[0]?.data;
          const chordData = getChordData(chordName);

          if (!chordData) return <span className="chord">{chordName}</span>;

          return (
            <Popover.Root>
              <Popover.Trigger asChild>
                <span className="chord cursor-pointer-chord">{chordName}</span>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  side="top"
                  className="bg-[#0a0a0a] p-4 rounded-2xl shadow-2xl z-[200] border border-white/10"
                  sideOffset={8}
                >
                  <div className="flex flex-col items-center">
                    <p className="text-primary font-black mb-2">{chordName.replace('[', '').replace(']', '')}</p>
                    <div className="w-32 h-40 bg-white rounded-lg p-2 chord-diagram-container">
                      <Chord
                        chord={chordData}
                        instrument={{
                          strings: 6,
                          fretsOnChord: 4,
                          name: 'Guitar',
                          keys: [],
                          tunings: { standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] }
                        }}
                      />
                    </div>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          );
        }
      }
    };

    return <div className="lyrics-view">{parse(transposedLyrics, options)}</div>;
  };

  if (!song) return null;

  const videoId = song.youtubeUrl ? song.youtubeUrl.split('v=')[1]?.split('&')[0] : null;

  const handleTranspose = (steps) => {
    setSemitones(steps);
  };

  const baseKey = song.key || song.originalKey || 'C';
  const isMinor = baseKey.includes('m');
  const cleanBaseKey = baseKey.replace('m', '');

  const originalKeyIndex = NOTES.indexOf(cleanBaseKey);
  const newKeyIndex = originalKeyIndex !== -1 ? (originalKeyIndex + semitones + 12) % 12 : 0;
  const newKey = originalKeyIndex !== -1 ? NOTES[newKeyIndex] + (isMinor ? 'm' : '') : baseKey;

  return (
    <div className={`fixed inset-0 bg-black md:bg-black/90 md:backdrop-blur-xl z-[150] overflow-hidden animate-fade-in flex items-start md:items-center justify-center p-0 md:p-4 no-print`}>
      <div className="bg-surface border-none md:border border-white/10 rounded-none md:rounded-main w-full max-w-6xl shadow-2xl relative overflow-y-auto md:overflow-hidden flex flex-col md:flex-row h-full md:h-full md:max-h-[90vh] custom-scrollbar">

        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Mobile Sticky Header */}
        <div className="md:hidden sticky top-0 z-[60] bg-surface/95 backdrop-blur-xl p-6 pb-4 border-b border-white/5">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mb-4 group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
          </button>
          <h3 className="text-lg font-extrabold text-white mb-0.5 leading-tight">{song.title}</h3>
          <p className="text-primary text-xs font-bold">{song.artist}</p>
        </div>

        <div className="modal-sidebar w-full md:w-[380px] lg:w-[400px] flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative bg-black/20 shrink-0 no-print">
          {/* Desktop Static Header */}
          <div className="hidden md:block p-6 md:p-8 pb-4">
            <button
              onClick={onClose}
              className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mb-4 md:mb-8 group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
            </button>
            <h3 className="text-lg md:text-xl font-extrabold text-white mb-1 leading-tight">{song.title}</h3>
            <p className="text-primary text-sm font-bold">{song.artist}</p>
          </div>

          <div className="p-6 md:p-8 pt-0 space-y-6 md:space-y-8 overflow-y-visible md:overflow-y-auto custom-scrollbar">
            {videoId ? (
              <div className="rounded-sub overflow-hidden shadow-2xl bg-black border border-white/5 aspect-video relative group cursor-pointer" onClick={() => setShowVideo(true)}>
                {!showVideo ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm group-hover:bg-black/20 transition-all">
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      alt=""
                      onError={(e) => { e.target.src = `https://img.youtube.com/vi/${videoId}/0.jpg`; }}
                    />
                    <div className="relative z-10 w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 ml-1" viewBox="0 0 24 24"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>
                    </div>
                    <span className="relative z-10 mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">Cargar Video</span>
                  </div>
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0"
                    title="YouTube Preview"
                  ></iframe>
                )}
              </div>
            ) : (
              <div className="rounded-sub bg-white/5 border border-white/5 aspect-video flex items-center justify-center">
                <p className="text-gray-500 text-xs font-medium">No hay video disponible</p>
              </div>
            )}

            {/* 1. Tono Original, Tono Actual */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white/5 border border-white/5 p-3 md:p-4 rounded-sub flex flex-col items-center justify-center text-center">
                <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tono Original</p>
                <div className="flex flex-col items-center">
                  <span className="text-lg md:text-xl font-black text-white leading-tight">{song.originalKey || song.key || '-'}</span>
                  {song.vocalistKey && (
                    <span className="text-[7px] md:text-[8px] text-primary font-bold uppercase tracking-tighter">Vocalista: {song.vocalistKey}</span>
                  )}
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 md:p-4 rounded-sub flex flex-col items-center justify-center text-center">
                <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tono Actual</p>
                <div className="flex flex-col items-center">
                  <span className="text-lg md:text-xl font-black text-primary leading-tight">{newKey}</span>
                  <span className="text-[8px] md:text-[9px] text-gray-600 font-bold">({semitones >= 0 ? `+${semitones}` : semitones})</span>
                </div>
              </div>
            </div>

            {/* 2. Transpose */}
            <div className="space-y-2 md:space-y-3 pt-4 border-t border-white/5">
              <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Transponer Vista</p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => handleTranspose(semitones - 1)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg>
                </button>
                <button
                  onClick={() => handleTranspose(0)}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-primary/10 text-primary text-[8px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all border border-primary/20"
                >
                  Reset
                </button>
                <button
                  onClick={() => handleTranspose(semitones + 1)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg>
                </button>
              </div>
            </div>

            {/* 3. BPM (Original) */}
            <div className="bg-white/5 border border-white/5 p-4 md:p-5 rounded-sub flex flex-col items-center justify-center text-center">
              <p className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">BPM Original</p>
              <p className="text-xl md:text-2xl font-black text-white tracking-widest">{song.bpm || '-'}</p>
            </div>

            {/* 4. Modulo de metronomo */}
            <div className={`relative bg-white/5 border ${isPlaying ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/5'} p-4 md:p-5 rounded-sub flex flex-col items-center justify-center transition-all overflow-hidden`}>
              {isPlaying && (
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                  <div
                    className="h-full bg-primary transition-all duration-75"
                    style={{
                      width: `${((currentBeat + 1) / parseInt(timeSignature)) * 100}%`,
                      opacity: currentBeat === 0 ? 1 : 0.6
                    }}
                  />
                </div>
              )}

              <div className="w-full flex justify-between items-center mb-3 md:mb-4">
                <p className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-wider">Metrónomo</p>
                <div className="flex space-x-1.5 md:space-x-2">
                  {[...Array(parseInt(timeSignature))].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-150 ${i === currentBeat ? 'bg-primary scale-125 shadow-[0_0_8px_rgba(251,174,0,0.6)]' : 'bg-white/10'
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 md:space-x-6 mb-3 md:mb-4">
                <button
                  onClick={() => setBpm(prev => Math.max(30, prev - 1))}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H5V11H19V13Z" /></svg>
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-2xl md:text-4xl font-black text-white tracking-tighter">{bpm}</span>
                  <span className="text-[7px] md:text-[9px] font-bold text-gray-500 uppercase tracking-widest">BPM Ensayo</span>
                </div>
                <button
                  onClick={() => setBpm(prev => Math.min(300, prev + 1))}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-90"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>
                </button>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 mt-1 md:mt-2">
                <button
                  onClick={toggleMetronome}
                  className={`py-2.5 md:py-3 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all px-3 md:px-4 ${isPlaying
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner'
                    : 'bg-primary text-black hover:bg-primary-hover shadow-lg shadow-primary/20'
                    }`}
                >
                  {isPlaying ? 'Parar' : 'Iniciar'}
                </button>
                <div className="relative group">
                  <select
                    value={timeSignature}
                    onChange={(e) => setTimeSignature(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-[9px] md:text-[11px] font-black rounded-xl px-2 py-2.5 md:py-3 text-white focus:outline-none focus:border-primary/50 cursor-pointer appearance-none text-center hover:bg-white/10 transition-all font-inter"
                  >
                    <option value="4/4" className="bg-[#1a1a1a]">4/4</option>
                    <option value="3/4" className="bg-[#1a1a1a]">3/4</option>
                    <option value="6/8" className="bg-[#1a1a1a]">6/8</option>
                    <option value="2/4" className="bg-[#1a1a1a]">2/4</option>
                  </select>
                </div>
              </div>
            </div>

            {song.notes && (
              <div className="bg-primary/5 border border-primary/10 p-5 md:p-6 rounded-sub">
                <p className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-widest mb-2 md:mb-3">Notas del autor</p>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic">"{song.notes}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-black/40 relative print:bg-white overflow-y-visible md:overflow-y-auto">
          <div className="hidden print:block mb-10 border-b-4 border-black pb-6 px-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <img src="/favicon.png" alt="GI Logo" className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tight text-black">GI <span className="text-black">Setlist</span></span>
              </div>
              <p className="text-[10px] font-bold text-gray-400">Generado por GI Setlist</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-1">{song.title}</h1>
                <p className="text-xl text-gray-700 font-bold">{song.artist}</p>
              </div>
              <div className="flex space-x-10 text-right">
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">Tono Actual</p>
                  <p className="text-3xl font-black text-black">{newKey}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">BPM</p>
                  <p className="text-3xl font-black text-black">{song.bpm || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between md:sticky top-0 bg-surface/80 md:backdrop-blur-md z-10 no-print">
            <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Letra y Acordes</h4>
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => window.print()}
                className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-[8px] md:text-[10px] font-bold uppercase tracking-widest"
              >
                Imprimir / PDF
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 md:p-12 overflow-y-visible md:overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="rich-text-content text-gray-300 break-words max-w-full">
              {renderLyrics()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;