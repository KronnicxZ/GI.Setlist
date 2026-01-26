import React, { useState } from 'react';
import { NOTES, transposeText } from '../utils/chordTransposer';

const DuplicateModal = ({ song, onConfirm, onCancel }) => {
    const [targetKey, setTargetKey] = useState(song.vocalistKey || song.key || 'C');
    const [vocalistName, setVocalistName] = useState('');

    const currentKey = song.key || 'C';

    // Extraer la nota base para el cálculo de semitonos (ignorando 'm' si existe)
    const getBaseNote = (key) => key.replace('m', '');

    const calculateSemitones = (from, to) => {
        const fromIndex = NOTES.indexOf(normalizeNote(getBaseNote(from)));
        const toIndex = NOTES.indexOf(normalizeNote(getBaseNote(to)));
        if (fromIndex === -1 || toIndex === -1) return 0;
        return (toIndex - fromIndex + 12) % 12;
    };

    const normalizeNote = (note) => {
        const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
        return flatToSharp[note] || note;
    };

    const handleConfirm = () => {
        const semitones = calculateSemitones(currentKey, targetKey);
        const duplicatedData = {
            ...song,
            title: vocalistName ? `${song.title} (${vocalistName})` : `${song.title} (${targetKey})`,
            key: targetKey,
            vocalistKey: targetKey,
            lyrics: semitones === 0 ? song.lyrics : transposeText(song.lyrics, semitones)
        };
        // Quitamos los IDs para que sea una nueva entrada
        delete duplicatedData.id;
        delete duplicatedData._id;

        onConfirm(duplicatedData);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-main w-full max-w-md shadow-2xl overflow-hidden relative">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Duplicar con Transposición</h2>
                    <p className="text-sm text-gray-500 mb-6">Crea una versión personalizada de "{song.title}" transponiendo los acordes automáticamente.</p>

                    <div className="space-y-6">
                        {/* Tono Actual */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-sub border border-white/5">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tono Actual</span>
                            <span className="text-lg font-black text-white">{currentKey}</span>
                        </div>

                        {/* Vocalista Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre Vocalista (Opcional)</label>
                            <input
                                type="text"
                                value={vocalistName}
                                onChange={(e) => setVocalistName(e.target.value)}
                                placeholder="Ej: Jose, Maria..."
                                className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                            />
                        </div>

                        {/* Nuevo Tono Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nuevo Tono</label>
                            <div className="grid grid-cols-4 gap-2">
                                {NOTES.map(note => (
                                    <button
                                        key={note}
                                        onClick={() => setTargetKey(note + (currentKey.includes('m') ? 'm' : ''))}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all border ${getBaseNote(targetKey) === note
                                                ? 'bg-primary text-black border-primary'
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        {note}{currentKey.includes('m') ? 'm' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-2.5 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        Duplicar ahora
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateModal;
