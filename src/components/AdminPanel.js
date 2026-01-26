import React from 'react';

const AdminPanel = ({ onClose, onBackup, onRestore, onLogout }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-main w-full max-w-md shadow-2xl flex flex-col relative">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="relative py-5 px-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Panel de Administrador</h2>
                        <p className="text-sm text-gray-500 font-medium">Gestiona tu cuenta y datos</p>
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

                <div className="flex-1 p-6 space-y-4">
                    {/* Backup Button */}
                    <button
                        onClick={() => {
                            onBackup();
                            onClose();
                        }}
                        className="w-full p-4 bg-primary/10 text-primary rounded-sub font-bold flex items-center justify-center space-x-2 border border-primary/20 hover:bg-primary/20 active:scale-[0.98] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                        </svg>
                        <span>Respaldar Datos</span>
                    </button>

                    {/* Restore Button */}
                    <label className="w-full p-4 bg-blue-500/10 text-blue-400 rounded-sub font-bold flex items-center justify-center space-x-2 border border-blue-500/20 hover:bg-blue-500/20 active:scale-[0.98] transition-all cursor-pointer">
                        <input type="file" className="hidden" accept=".json" onChange={(e) => { onRestore(e); onClose(); }} />
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M5,20H19V18H5M5,10H9V16H15V10H19L12,3L5,10Z" />
                        </svg>
                        <span>Restaurar Copia</span>
                    </label>

                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        className="w-full p-4 bg-red-400/10 text-red-400 rounded-sub font-bold flex items-center justify-center space-x-2 border border-red-400/20 hover:bg-red-400/20 active:scale-[0.98] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
