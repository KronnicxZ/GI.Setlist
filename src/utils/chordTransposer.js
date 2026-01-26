const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Expresión regular mejorada para detectar acordes musicales
// Detecta: Notas base (A-G), alteraciones (#, b, b5, #5), calidades (m, maj, sus, dim, etc), 
// tensiones (2, 4, 5, 6, 7, 9, 11, 13), bajos (/) y variaciones comunes
const CHORD_REGEX = /\b[A-G](?:b|#)?(?:maj|MAJ|Maj|MIN|Min|min|m|M|aug|AUG|Aug|dim|DIM|Dim|sus|SUS|Sus|add|ADD|Add|Δ)?[0-9]*(?:sus[24]|add[0-9]+)?(?:[\(\+]?[0-9]+[\)\+]?)*(?:\/[A-G](?:b|#)?)?\b/g;

// Función para normalizar un acorde a su forma con sostenidos
const normalizeChord = (chord) => {
  const flatToSharp = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };

  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const [, note, modifier] = match;
  const normalizedNote = flatToSharp[note] || note;
  return normalizedNote + modifier;
};

// Función para transponer un acorde
const transposeChord = (chord, semitones) => {
  const normalizedChord = normalizeChord(chord);
  const match = normalizedChord.match(/^([A-G][#]?)(.*)$/);
  if (!match) return chord;

  const [, note, modifier] = match;
  const noteIndex = NOTES.indexOf(note);
  if (noteIndex === -1) return chord;

  const newIndex = (noteIndex + semitones + 12) % 12;
  return NOTES[newIndex] + modifier;
};

// Función mágica para detectar y encerrar acordes entre corchetes
const autoBracketChords = (text) => {
  if (!text) return '';

  // Procesar línea por línea
  return text.split('\n').map(line => {
    // Si la línea está vacía, retornar igual
    if (!line.trim()) return line;

    // Detectamos cuántos "acordes" potenciales hay
    const words = line.trim().split(/\s+/);

    return line.replace(CHORD_REGEX, (match, offset, fullText) => {
      // Verificar si ya tiene corchetes antes o después
      const prevChar = fullText[offset - 1];
      const nextChar = fullText[offset + match.length];

      if (prevChar === '[' && nextChar === ']') {
        return match; // Ya está encerrado
      }

      // Evitar encerrar palabras sueltas como "A" o "I" si parecen parte de una oración
      if ((match === 'A' || match === 'E' || match === 'I') && words.length > 4 && !line.includes('  ')) {
        return match;
      }

      return `[${match}]`;
    });
  }).join('\n');
};

// Expresión regular para detectar secciones (Verso, Coro, etc.)
const SECTION_REGEX = /\b(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Pre-Coro|Estribillo|Bridge|Chorus|Verse|Tag|Ending)\b[:]?/gi;

// Función para transponer texto con acordes (ahora soporta HTML)
const transposeText = (text, semitones) => {
  if (!text) return '';

  // El regex busca patrones [Acorde] incluso si están rodeados de HTML
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    const transposedChord = transposeChord(chord, semitones);
    return `[${transposedChord}]`;
  });
};

// Función para formatear el texto para visualización (añade color a acordes y secciones)
const formatLyricsForDisplay = (text) => {
  if (!text) return '';

  let formatted = text;

  // 1. Procesar secciones: Detectar [Intro] o Intro: o Intro al inicio de línea
  // Soporta prefijos como "Pre-" (ej. Pre-Coro) y sufijos numéricos (ej. Verso II)
  const sectionWords = '(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Estribillo|Bridge|Chorus|Verse|Tag|Ending|Final)';

  // Regex corregido: captura opcionalmente "Pre-" o "Pre " antes de la palabra clave
  const combinedSectionRegex = new RegExp(`(?:\\[(?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?\\])|(?:\\b(?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?\\b:?)`, 'gi');

  formatted = formatted.replace(combinedSectionRegex, (match) => {
    // Limpiar corchetes y dos puntos para el texto final
    const cleanSection = match.replace(/[\[\]:]/g, '');
    return `<span class="section-label">${cleanSection}</span>`;
  });

  // 2. Procesar acordes restantes: [G] -> <span class="chord">[G]</span>
  // Solo procesamos lo que queda con corchetes (que no sean las secciones ya procesadas)
  formatted = formatted.replace(/\[([^\]]+)\]/g, (match, content) => {
    return `<span class="chord">[${content}]</span>`;
  });

  return formatted;
};

// Función para formatear texto específicamente para el editor Quill
// (Añade corchetes a acordes y color a secciones)
const formatLyricsForQuill = (text) => {
  if (!text) return '';

  // 1. Primero encerrar acordes en corchetes
  let processed = autoBracketChords(text);

  // 2. Colorear secciones: [INTRO], [CORO], etc.
  const sectionWords = '(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Estribillo|Bridge|Chorus|Verse|Tag|Ending|Final|Prec-Coro|Pre coro|Pre-coro|Precoro)';
  const sectionRegex = new RegExp(`\\[((?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?)\\]`, 'gi');

  processed = processed.replace(sectionRegex, (match, content) => {
    // Usamos el color azul del sistema (#60a5fa)
    return `<span style="color: rgb(96, 165, 250);"><strong>[${content.toUpperCase()}]</strong></span>`;
  });

  // 3. Colorear acordes: [G] -> amarillo
  processed = processed.replace(/\[([A-G][b#]?[^\]]*)\]/g, (match, content) => {
    // Evitar colorear si ya es una sección (que son azules)
    // Buscamos si el match está dentro del span azul anterior
    return `<span style="color: rgb(251, 174, 0);"><strong>[${content}]</strong></span>`;
  });

  return processed;
};

export { transposeText, transposeChord, autoBracketChords, formatLyricsForDisplay, formatLyricsForQuill, NOTES };