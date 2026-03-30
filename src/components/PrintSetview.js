import React from 'react';
import parse from 'html-react-parser';
import { formatLyricsForDisplay } from '../utils/chordTransposer';

const PrintSetview = ({ setlist, songs }) => {
  if (!setlist || !songs || songs.length === 0) return null;

  return (
    <div className="hidden print:block bg-white text-black p-8 font-serif">
      <div className="border-b-4 border-black pb-6 mb-10">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{setlist.name}</h1>
        {setlist.date && (
          <p className="text-xl font-bold text-gray-700">
            {new Date(setlist.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
          </p>
        )}
      </div>

      <div className="space-y-20">
        {songs.map((song, index) => {
          const formatted = formatLyricsForDisplay(song.lyrics || '');
          return (
            <div key={song.id || index} className="break-after-page">
              <div className="flex justify-between items-baseline border-b-2 border-gray-200 pb-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black uppercase">{index + 1}. {song.title}</h2>
                  <p className="text-lg font-bold text-gray-600">{song.artist}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tono</p>
                  <p className="text-2xl font-black">{song.key || song.originalKey || '-'}</p>
                </div>
              </div>
              <div className="rich-text-content-print text-sm leading-relaxed">
                {parse(formatted.replace(/\[/g, '<span class="chord-print">[').replace(/\]/g, ']</span>'))}
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @media print {
          .break-after-page { page-break-after: always; }
          .chord-print { color: #000; font-weight: bold; }
          .section-label { 
            display: block; 
            border-left: 3px solid #000; 
            padding-left: 10px; 
            margin: 15px 0 5px 0; 
            font-weight: bold; 
            text-transform: uppercase;
            font-size: 10px;
          }
          .rich-text-content-print {
            column-count: 2;
            column-gap: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintSetview;
