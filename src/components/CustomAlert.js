import React from 'react';

const CustomAlert = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface border border-white/10 rounded-main w-full max-w-md shadow-2xl flex flex-col relative animate-scale-in">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="relative p-6">
                    <div className="flex items-start space-x-4 mb-6">
                        {type === 'confirm' && (
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                </svg>
                            </div>
                        )}
                        {type === 'success' && (
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                                </svg>
                            </div>
                        )}
                        {type === 'error' && (
                            <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                </svg>
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                        {type === 'confirm' && (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors rounded-sub hover:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-8 py-3 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                                >
                                    Aceptar
                                </button>
                            </>
                        )}
                        {(type === 'success' || type === 'error') && (
                            <button
                                onClick={onClose}
                                className="px-8 py-3 text-sm font-bold text-black bg-primary rounded-sub hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                            >
                                Aceptar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomAlert;
