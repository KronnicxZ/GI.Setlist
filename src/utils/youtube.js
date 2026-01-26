// Función para extraer el ID del video de una URL de YouTube
export const extractYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Función para convertir la duración de YouTube (ISO 8601) a formato legible
export const formatDuration = (duration) => {
  if (!duration) return '-';

  // Convertir duración ISO 8601 a minutos y segundos
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  if (!match) return '-';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let result = '';

  if (hours) {
    result += `${hours}:`;
    result += `${minutes.padStart(2, '0')}:`;
  } else if (minutes) {
    result += `${minutes}:`;
  } else {
    result += '0:';
  }

  result += seconds.padStart(2, '0');

  return result;
};

const API_URL = process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

// Función para obtener la información del video a través del proxy del backend
export const getVideoDetails = async (videoId) => {
  if (!videoId) return null;

  try {
    const response = await fetch(`${API_URL}/youtube/details?videoId=${videoId}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    return {
      title: data.title,
      channelTitle: data.channelTitle,
      duration: formatDuration(data.durationRaw)
    };
  } catch (error) {
    console.error('Error fetching video details via proxy:', error);
    return null;
  }
};

// Función para obtener solo la duración (usando la misma ruta de proxy)
export const getVideoDuration = async (videoId) => {
  const details = await getVideoDetails(videoId);
  return details ? details.duration : '-';
};