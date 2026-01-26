import React from 'react';

const SearchBar = ({ value, onSearch }) => {
  return (
    <div className="relative group">
      <input
        type="text"
        placeholder="Buscar por título o artista..."
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full h-[42px] pl-11 pr-10 bg-white/5 border border-white/10 rounded-sub text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-sm"
      />
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-hover:text-primary transition-colors">
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      </div>
      {value && (
        <button
          onClick={() => onSearch('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;