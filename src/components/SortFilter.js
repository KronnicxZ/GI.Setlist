import React, { useState, useRef, useEffect } from 'react';

const SortFilter = ({ onSortChange, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Recientes');
  const dropdownRef = useRef(null);

  const options = [
    { value: '', label: 'Recientes' },
    { value: 'title', label: 'Título' },
    { value: 'artist', label: 'Artista' },
    { value: 'genre', label: 'Género' },
    { value: 'bpm', label: 'BPM' },
    { value: 'key', label: 'Tono' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option.label);
    onSortChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${compact ? 'w-10 h-10 flex items-center justify-center' : 'w-full h-[42px] px-4'} text-left text-white bg-white/5 border border-white/10 rounded-sub hover:bg-white/[0.08] focus:outline-none focus:border-primary/50 transition-all flex items-center justify-between`}
        title={compact ? `Ordenar por: ${selectedOption}` : ''}
      >
        {!compact ? (
          <>
            <span className="text-xs font-semibold text-gray-400">
              Ordenar: <span className="text-white ml-1">{selectedOption}</span>
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          <svg className={`w-5 h-5 ${isOpen ? 'text-primary' : 'text-gray-400'}`} viewBox="0 0 24 24">
            <path fill="currentColor" d="M3,13H15V11H3M3,6V8H21V6M3,18H9V16H3V18Z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-[100] ${compact ? 'right-0 w-32' : 'w-full'} mt-2 bg-card border border-white/10 rounded-sub shadow-2xl overflow-hidden translate-y-0 animate-fade-in backdrop-blur-xl`}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2.5 text-xs font-medium text-left transition-colors ${selectedOption === option.label
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortFilter; 