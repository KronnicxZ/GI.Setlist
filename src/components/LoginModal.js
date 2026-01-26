import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      onClose();
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface border border-white/10 rounded-main w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
              <p className="text-sm text-gray-500 font-medium">Acceso para administradores</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full px-5 py-4 bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-sub text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all font-medium text-lg`}
                  placeholder="••••••••••••"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3Z" />
                  </svg>
                </div>
              </div>
              {error && (
                <p className="flex items-center space-x-2 mt-2 text-sm text-red-400 ml-1 animate-fade-in">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Iniciar sesión
            </button>

            <p className="text-center text-[11px] text-gray-600 font-medium">
              Protegido por GI Setlist Security
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 