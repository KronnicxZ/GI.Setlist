import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
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
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [bpm, setBpm] = useState(Number(song?.bpm) || 120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  // Audio Player State (Spotify-like)
  const [playerPlaying, setPlayerPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const synth = useRef(null);
  const repeatId = useRef(null);
  const beatCounter = useRef(0);
  const playerRef = useRef(null);

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

  // Metronome Sound Setup
  useEffect(() => {
    synth.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.0001, decay: 0.2, sustain: 0 }
    }).toDestination();

    return () => {
      if (synth.current) synth.current.dispose();
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    };
  }, []);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  useEffect(() => {
    if (isMetronomePlaying) {
      const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
      if (repeatId.current !== null) {
        Tone.getTransport().clear(repeatId.current);
      }
      repeatId.current = Tone.getTransport().scheduleRepeat((time) => {
        const beat = beatCounter.current;
        if (beat === 0) {
          synth.current.triggerAttackRelease("C4", "32n", time, 1.0);
        } else {
          synth.current.triggerAttackRelease("G3", "32n", time, 0.4);
        }
        Tone.Draw.schedule(() => { setCurrentBeat(beat); }, time);
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
  }, [isMetronomePlaying, timeSignature]);

  const toggleMetronome = async () => {
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
    }
    setIsMetronomePlaying(!isMetronomePlaying);
  };

  // Player Handlers
  const handlePlayPause = () => setPlayerPlaying(!playerPlaying);
  const handleStop = () => {
    setPlayerPlaying(false);
    playerRef.current?.seekTo(0);
    setPlayed(0);
  };
  const handleProgress = (state) => {
    if (!seeking) setPlayed(state.played);
  };
  const handleDuration = (duration) => setDuration(duration);
  const handleSeekChange = (e) => setPlayed(parseFloat(e.target.value));
  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const getChordData = (chordName) => {
    if (!chordName) return null;
    const cleanName = chordName.replace('[', '').replace(']', '');
    const match = cleanName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return null;
    const [, base, suffix] = match;
    const keyMap = { 'C': 'C', 'C#': 'Csharp', 'Db': 'Csharp', 'D': 'D', 'D#': 'Eb', 'Eb': 'Eb', 'E': 'E', 'F': 'F', 'F#': 'Fsharp', 'Gb': 'Fsharp', 'G': 'G', 'G#': 'Ab', 'Ab': 'Ab', 'A': 'A', 'A#': 'Bb', 'Bb': 'Bb', 'B': 'B' };
    const mappedKey = keyMap[base];
    if (!mappedKey) return null;
    const suffixMap = { '': 'major', 'm': 'minor', '7': '7', 'm7': 'minor7', 'maj7': 'maj7', 'sus2': 'sus2', 'sus4': 'sus4', 'add9': 'add9', 'dim': 'diminished', 'aug': 'augmented', '6': '6', '9': '9', '11': '11', '13': '13' };
    let mappedSuffix = suffixMap[suffix] || suffix;
    const keyData = guitarDb.chords[mappedKey];
    if (!keyData) return null;
    let chordInfo = keyData.find(c => c.suffix === mappedSuffix);
    if (!chordInfo && suffix.startsWith('m')) chordInfo = keyData.find(c => c.suffix === 'minor');
    return chordInfo ? chordInfo.positions[0] : null;
  };

  const renderLyrics = () => {
    if (!transposedLyrics) return <p className="text-gray-600 italic">No hay letra disponible.</p>;
    const options = {
      replace: (domNode) => {
        if (domNode.attribs && domNode.attribs.class === 'chord') {
          const chordName = domNode.children[0]?.data;
          const chordData = getChordData(chordName);
          if (!chordData) return <span className="chord">{chordName}</span>;
          return (
            <Popover.Root>
              <Popover.Trigger asChild><span className="chord cursor-pointer-chord">{chordName}</span></Popover.Trigger>
              <Popover.Portal>
                <Popover.Content side="top" className="bg-[#0a0a0a] p-4 rounded-2xl shadow-2xl z-[200] border border-white/10" sideOffset={8}>
                  <div className="flex flex-col items-center">
                    <p className="text-primary font-black mb-2">{chordName.replace('[', '').replace(']', '')}</p>
                    <div className="w-32 h-40 bg-white rounded-lg p-2"><Chord chord={chordData} instrument={{ strings: 6, fretsOnChord: 4, name: 'Guitar', keys: [], tunings: { standard: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] } }} /></div>
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

  const handleTranspose = (steps) => setSemitones(steps);
  const baseKey = song.key || song.originalKey || 'C';
  const isMinor = baseKey.includes('m');
  const cleanBaseKey = baseKey.replace('m', '');
  const originalKeyIndex = NOTES.indexOf(cleanBaseKey);
  const newKeyIndex = originalKeyIndex !== -1 ? (originalKeyIndex + semitones + 12) % 12 : 0;
  const newKey = originalKeyIndex !== -1 ? NOTES[newKeyIndex] + (isMinor ? 'm' : '') : baseKey;

  return (
    <div className="fixed inset-0 bg-black/95 z-[150] overflow-y-auto md:overflow-hidden flex items-start md:items-center justify-center p-0 md:p-4 animate-fade-in">
      <div className="bg-surface md:border border-white/10 rounded-none md:rounded-main w-full max-w-6xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-auto md:h-[90vh]">

        {/* PLAYER ENGINE (Hidden but active) */}
        <div className="sr-only">
          <ReactPlayer
            ref={playerRef}
            url={song.youtubeUrl}
            playing={playerPlaying}
            onProgress={handleProgress}
            onDuration={handleDuration}
            width="1px"
            height="1px"
            config={{
              youtube: {
                playerVars: { showinfo: 0, rel: 0, modestbranding: 1 }
              }
            }}
          />
        </div>

        <div className="modal-sidebar w-full md:w-[380px] flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative bg-black/20 shrink-0">
          <div className="p-6 md:p-8 pb-4">
            <button onClick={onClose} className="flex items-center space-x-2 text-gray-500 hover:text-white mb-6 group transition-all">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Cerrar</span>
            </button>
            <h3 className="text-xl font-black text-white leading-tight">{song.title}</h3>
            <p className="text-primary text-sm font-bold mt-1 opacity-80">{song.artist}</p>
          </div>

          <div className="p-6 md:p-8 pt-0 space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-32 md:pb-8">
            {/* SPOTIFY PLAYER UI */}
            <div className="bg-[#111111] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <div className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(251,174,0,0.5)]" style={{ width: `${played * 100}%` }} />
              </div>

              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="text-[10px] font-mono text-gray-500">{formatTime(played * duration)}</span>
                <span className="text-[10px] font-mono text-gray-400">{formatTime(duration)}</span>
              </div>

              <input
                type="range"
                min={0}
                max={0.999999}
                step="any"
                value={played}
                onMouseDown={handleSeekMouseDown}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
                onTouchStart={handleSeekMouseDown}
                onTouchEnd={handleSeekMouseUp}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary mb-6"
              />

              <div className="flex items-center justify-center space-x-8">
                <button onClick={handleStop} className="p-2 text-gray-500 hover:text-white transition-colors active:scale-90"><svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="currentColor" d="M18,18H6V6H18V18Z" /></svg></button>
                <button onClick={handlePlayPause} className="w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-lg shadow-primary/20">
                  {playerPlaying ? <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z" /></svg> : <svg className="w-8 h-8 ml-1" viewBox="0 0 24 24"><path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" /></svg>}
                </button>
                <div className="w-10"></div>
              </div>
            </div>

            {/* Tono & Transpose */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tono Original</p>
                <span className="text-xl font-black text-white">{song.originalKey || song.key || '-'}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tono Actual</p>
                <span className="text-xl font-black text-primary">{newKey}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <button onClick={() => handleTranspose(semitones - 1)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" /></svg></button>
              <button onClick={() => handleTranspose(0)} className="px-6 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">Reset</button>
              <button onClick={() => handleTranspose(semitones + 1)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z" /></svg></button>
            </div>

            {/* Metronomo Compacto */}
            <div className={`p-5 rounded-2xl border transition-all ${isMetronomePlaying ? 'bg-primary/5 border-primary/30' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-gray-500">Metrónomo</span>
                <div className="flex space-x-1">
                  {[...Array(parseInt(timeSignature))].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentBeat ? 'bg-primary scale-125' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-3xl font-black text-white">{bpm}</span>
                  <button onClick={toggleMetronome} className={`px-5 py-2 rounded-lg text-xs font-black uppercase ${isMetronomePlaying ? 'bg-red-500/20 text-red-400' : 'bg-primary text-black'}`}>
                    {isMetronomePlaying ? 'Parar' : 'Activar'}
                  </button>
                </div>
                <select value={timeSignature} onChange={(e) => setTimeSignature(e.target.value)} className="bg-transparent text-xs font-bold focus:outline-none">
                  <option value="4/4">4/4</option><option value="3/4">3/4</option><option value="6/8">6/8</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-black/40 relative overflow-y-auto">
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-3xl z-10 no-print">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Letra y Acordes</h4>
            <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase hover:bg-white/10 transition-colors border border-white/5">Imprimir PDF</button>
          </div>
          <div className="p-6 md:p-12">
            {renderLyrics()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;