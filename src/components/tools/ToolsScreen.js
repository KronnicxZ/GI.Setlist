import React, { useState } from 'react';
import Metronome from './Metronome';
import Tuner from './Tuner';
import TapTempo from './TapTempo';
import Transposer from './Transposer';
import CircleOfFifths from './CircleOfFifths';
import Progressions from './Progressions';
import ChatAI from './ChatAI';

const toolsList = [
  { id: 'chatai', name: 'Asistente IA', desc: 'Pregunta sobre acordes, progresiones y teoría musical', icon: 'M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z', color: 'from-pink-500 to-purple-600', bg: 'bg-gradient-to-br from-pink-500/15 to-purple-600/15', border: 'border-pink-500/20', iconColor: 'text-pink-400' },
  { id: 'metronome', name: 'Metrónomo', desc: 'Mantén el tempo con precisión y detecta BPM desde YouTube', icon: 'M12,1.75L8.57,2.67L4.07,19.5C4.06,19.5 4,19.84 4,20C4,21.11 4.89,22 6,22H18C19.11,22 20,21.11 20,20C20,19.84 19.94,19.5 19.93,19.5L15.43,2.67L12,1.75M10.29,4.2L12,3.74L13.71,4.2L16.13,13H7.87L10.29,4.2M12,17.5A1.5,1.5 0 0,1 13.5,19A1.5,1.5 0 0,1 12,20.5A1.5,1.5 0 0,1 10.5,19A1.5,1.5 0 0,1 12,17.5Z', color: 'from-amber-500 to-orange-600', bg: 'bg-gradient-to-br from-amber-500/15 to-orange-600/15', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
  { id: 'tuner', name: 'Afinador', desc: 'Afina tu instrumento usando el micrófono en tiempo real', icon: 'M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z', color: 'from-blue-500 to-cyan-600', bg: 'bg-gradient-to-br from-blue-500/15 to-cyan-600/15', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
  { id: 'taptempo', name: 'Tap Tempo', desc: 'Toca al ritmo para descubrir el BPM de cualquier canción', icon: 'M13,2.05V4.05C17.39,4.59 20.5,8.58 19.96,12.97C19.5,16.61 16.64,19.5 13,19.93V21.93C18.5,21.38 22.5,16.5 21.95,11C21.5,6.25 17.73,2.5 13,2.03V2.05M5.67,19.74C7.18,21 9.04,21.79 11,22V20C9.58,19.82 8.23,19.25 7.1,18.37L5.67,19.74M7.1,5.74C8.22,4.84 9.57,4.26 11,4.06V2.06C9.05,2.25 7.19,3 5.67,4.26L7.1,5.74M5.69,7.1L4.26,5.67C3,7.19 2.25,9.04 2.05,11H4.05C4.24,9.58 4.8,8.23 5.69,7.1M4.06,13H2.06C2.26,14.96 3.03,16.81 4.27,18.33L5.69,16.9C4.81,15.77 4.24,14.42 4.06,13M10,16.5L16,12L10,7.5V16.5Z', color: 'from-green-500 to-emerald-600', bg: 'bg-gradient-to-br from-green-500/15 to-emerald-600/15', border: 'border-green-500/20', iconColor: 'text-green-400' },
  { id: 'transposer', name: 'Transponer', desc: 'Cambia la tonalidad de cualquier canción con un clic', icon: 'M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z', color: 'from-purple-500 to-violet-600', bg: 'bg-gradient-to-br from-purple-500/15 to-violet-600/15', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
  { id: 'circle', name: 'Círculo de Quintas', desc: 'Visualiza relaciones armónicas entre todas las tonalidades', icon: 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z', color: 'from-orange-500 to-red-600', bg: 'bg-gradient-to-br from-orange-500/15 to-red-600/15', border: 'border-orange-500/20', iconColor: 'text-orange-400' },
  { id: 'progressions', name: 'Progresiones', desc: 'Explora las progresiones más usadas en música de adoración', icon: 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z', color: 'from-cyan-500 to-teal-600', bg: 'bg-gradient-to-br from-cyan-500/15 to-teal-600/15', border: 'border-cyan-500/20', iconColor: 'text-cyan-400' }
];

const ToolsScreen = () => {
  const [activeTool, setActiveTool] = useState(null);

  const renderTool = () => {
    switch (activeTool) {
      case 'chatai': return <ChatAI />;
      case 'metronome': return <Metronome />;
      case 'tuner': return <Tuner />;
      case 'taptempo': return <TapTempo />;
      case 'transposer': return <Transposer />;
      case 'circle': return <CircleOfFifths />;
      case 'progressions': return <Progressions />;
      default: return null;
    }
  };

  if (activeTool) {
    const currentTool = toolsList.find(t => t.id === activeTool);
    return (
      <div className="animate-fade-in w-full max-w-4xl mx-auto flex flex-col space-y-4">
        <button 
          onClick={() => setActiveTool(null)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors w-fit px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24"><path fill="currentColor" d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" /></svg>
          <span className="font-bold text-sm">{currentTool?.name || 'Volver'}</span>
        </button>
        {renderTool()}
      </div>
    );
  }

  return (
    <div className="flex flex-col px-2 md:px-8 w-full max-w-5xl mx-auto">
      <div className="mb-8 md:mb-10 text-center animate-fade-in">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-4">
          <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24"><path fill="currentColor" d="M21.71 20.29L20.29 21.71A1 1 0 0 1 18.88 21.71L7 9.85A3.81 3.81 0 0 1 6 10A4 4 0 0 1 2.22 4.7L4.76 7.24L5.29 6.71L6.71 5.29L7.24 4.76L4.7 2.22A4 4 0 0 1 10 6A3.81 3.81 0 0 1 9.85 7L21.71 18.88A1 1 0 0 1 21.71 20.29M2.29 18.88A1 1 0 0 0 2.29 20.29L3.71 21.71A1 1 0 0 0 5.12 21.71L10.59 16.25L7.76 13.42M20 2L16 4V6L13.83 8.17L15.83 10.17L18 8H20L22 4Z" /></svg>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Suite Musical</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-2">
          Herramientas
        </h2>
        <p className="text-gray-500 font-medium text-sm md:text-base max-w-md mx-auto">
          Todo lo que necesitas para ensayar, afinar y componer
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 animate-fade-in">
        {toolsList.map((tool, index) => (
          <div 
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`group relative p-5 md:p-6 ${tool.bg} border ${tool.border} rounded-2xl md:rounded-3xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-2xl overflow-hidden`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <div className="relative z-10 flex items-start space-x-4">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${tool.iconColor} bg-black/30 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24">
                  <path fill="currentColor" d={tool.icon} />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-base md:text-lg font-bold text-white tracking-wide">{tool.name}</span>
                <span className="text-xs text-gray-400 font-medium mt-1 leading-relaxed line-clamp-2">
                  {tool.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsScreen;
