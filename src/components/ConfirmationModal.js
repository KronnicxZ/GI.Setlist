import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-white/10 rounded-main w-full max-w-md p-8 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="w-14 h-14 bg-red-500/10 rounded-sub flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            {title}
          </h3>

          <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 order-2 sm:order-1 py-4 text-sm font-bold text-white bg-red-500/20 hover:bg-red-500 hover:text-white rounded-sub transition-all active:scale-[0.98]"
            >
              Confirmar
            </button>
            <button
              onClick={onClose}
              className="flex-1 order-1 sm:order-2 py-4 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-sub transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;