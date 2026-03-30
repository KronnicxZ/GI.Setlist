import { useState } from 'react';

export const useBackup = (apiUrl, setSuccessAlert, setErrorAlert) => {
  const [restoreAlert, setRestoreAlert] = useState({ isOpen: false, file: null, event: null });

  const handleBackup = async () => {
    try {
      const response = await fetch(`${apiUrl}/backup`);
      const backupData = await response.json();

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gi-setlist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error en backup:', error);
      setErrorAlert({ isOpen: true, message: 'Error al generar la copia de seguridad' });
    }
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setRestoreAlert({ isOpen: true, file, event });
  };

  const confirmRestore = async () => {
    const { file, event } = restoreAlert;
    setRestoreAlert({ isOpen: false, file: null, event: null });

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const response = await fetch(`${apiUrl}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      });

      if (response.ok) {
        setSuccessAlert({ isOpen: true, message: 'Base de datos restaurada correctamente. La página se recargará.' });
        setTimeout(async () => {
          if ('serviceWorker' in navigator && 'caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          window.location.reload(true);
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorAlert({ isOpen: true, message: `Error al restaurar: ${errorData.error || response.statusText}` });
      }
    } catch (error) {
      console.error('Error al restaurar:', error);
      setErrorAlert({ isOpen: true, message: `Error de red o de archivo: ${error.message || 'No se pudo conectar con el servidor'}` });
    } finally {
      if (event && event.target) {
        event.target.value = '';
      }
    }
  };

  return { restoreAlert, setRestoreAlert, handleBackup, handleRestore, confirmRestore };
};
