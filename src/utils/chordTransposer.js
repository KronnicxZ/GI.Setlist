const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Expresión regular mejorada para detectar acordes musicales con todas las variaciones
// Detecta: Notas base (A-G), alteraciones (#, b), calidades (m, maj, sus, dim, aug, etc),
// tensiones, alteraciones (b5, #9) y bajos (/). Evita problemas con bordes de palabra (\b) y caracteres especiales como #.
const CHORD_REGEX = /(^|\s|\()([A-G](?:b|#)?(?:maj|MAJ|Maj|MIN|Min|min|m|M|aug|AUG|Aug|dim|DIM|Dim|sus|SUS|Sus|add|ADD|Add|Δ|º|°|ø)?[0-9]*(?:sus[24]|add[0-9]+)?(?:[\(\+]?[#b0-9]+[\)\+]?)*(?:\/[A-G](?:b|#)?)?)(?=$|\s|\)|\r|\n|,|\.)/g;

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

// Función para limpiar acordes mal formados manualmente (ej: [D]# -> [D#], [A]m7 -> [Am7])
const fixMalformedChords = (text) => {
  if (!text) return '';
  const malformedRegex = /\[([A-G][b#]?[a-zA-Z0-9\+\-\/øº°]*)\]((?:#|b|m|maj|dim|aug|sus|add|M|[0-9]|\+|-|\/|ø|º|°)+)(?=$|\s|\)|\r|\n|,|\.)/gi;
  return text.replace(malformedRegex, (match, inside, outside) => {
    return `[${inside}${outside}]`;
  });
};

// Función mágica para detectar y encerrar acordes entre corchetes
const autoBracketChords = (text) => {
  if (!text) return '';

  let cleanedText = fixMalformedChords(text);

  // Procesar línea por línea
  return cleanedText.split('\n').map(line => {
    // Si la línea está vacía, retornar igual
    if (!line.trim()) return line;

    // Detectamos cuántos "acordes" potenciales hay
    const words = line.trim().split(/\s+/);

    // Usar un bucle manual ya que CHORD_REGEX no soporta intersecciones bien con replace global si captura espacios
    // Para simplificar, reemplazamos con la nueva lógica que captura prefijos
    return line.replace(CHORD_REGEX, (match, prefix, chordMatch) => {
      const fullTextMatch = prefix + chordMatch;
      
      // Evitar encerrar palabras sueltas como "A" o "E" o "I" si parecen parte de una oración normal (y la línea tiene muchas palabras)
      if ((chordMatch === 'A' || chordMatch === 'E' || chordMatch === 'I') && words.length > 4 && !line.includes('  ')) {
        return fullTextMatch;
      }

      // Evitar encerrar nombres de secciones si no tienen corchetes (ej: no convertir Coro en [Coro] si está en una oración)
      const isSectionWord = /^(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Estribillo|Final)$/i.test(chordMatch);
      if (isSectionWord && words.length > 1) {
        return fullTextMatch;
      }

      return `${prefix}[${chordMatch}]`;
    });
  }).join('\n');
};

// Expresión regular para detectar secciones (Verso, Coro, etc.) 
// Ahora es más estricta: requiere estar entre corchetes o seguida de dos puntos
const SECTION_REGEX = /(?:\[(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Pre-Coro|Estribillo|Bridge|Chorus|Verse|Tag|Ending|Final)\])|(?:\b(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Pre-Coro|Estribillo|Bridge|Chorus|Verse|Tag|Ending|Final)\b:)/gi;

// Función para transponer texto con acordes (ahora soporta HTML)
const transposeText = (text, semitones) => {
  if (!text) return '';

  let cleaned = fixMalformedChords(text);

  // El regex busca patrones [Acorde] incluso si están rodeados de HTML
  return cleaned.replace(/\[([^\]]+)\]/g, (match, chord) => {
    const transposedChord = transposeChord(chord, semitones);
    return `[${transposedChord}]`;
  });
};

// Función para formatear el texto para visualización (añade color a acordes y secciones)
const formatLyricsForDisplay = (text) => {
  if (!text) return '';

  let formatted = fixMalformedChords(text);

  // 1. Procesar secciones: Detectar [Intro] o Intro: o Intro al inicio de línea
  // Soporta prefijos como "Pre-" (ej. Pre-Coro) y sufijos numéricos (ej. Verso II)
  const sectionWords = '(Verso|Coro|Puente|Intro|Outro|Solo|Instrumental|Interludio|Estribillo|Bridge|Chorus|Verse|Tag|Ending|Final)';

  // Regex mejorado: 
  // 1. Detecta secciones entre corchetes: [Solo], [Coro]
  // 2. Detecta secciones seguidas de dos puntos: Intro:, Coro: 
  // 3. Detecta secciones que están SOLAS en una línea (sin más palabras después)
  const combinedSectionRegex = new RegExp(
    `(\\[(?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?\\])|` + // [Intro]
    `(\\b(?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?\\b:)|` + // Intro:
    `((?:^|\\r|\\n)\\s*(?:Pre[- ]?)?${sectionWords}(?:\\s+[IVX0-9]+)?\\s*(?=\\r|\\n|$))`, // Isolated line
    'gi'
  );

  formatted = formatted.replace(combinedSectionRegex, (match, inBrackets, withColon, isAlone) => {
    // Si no es ninguna de las formas de sección confirmadas, no reemplazamos
    if (!inBrackets && !withColon && !isAlone) return match;
    
    const cleanSection = match.trim().replace(/[\[\]:]/g, '');
    return `${isAlone && match.startsWith('\n') ? '\n' : ''}<span class="section-label">${cleanSection}</span>`;
  });

  // 2. Procesar acordes pegados a palabras (Estilo Inline: [G]Cuan) -> renderizados arriba
  formatted = formatted.replace(/\[([^\]]+)\]([^\s<\[]+)/g, (match, chord, word) => {
    return `<span class="chord-wrapper"><span class="lyric-word">${word}</span><span class="chord">[${chord}]</span></span>`;
  });

  // 3. Procesar acordes restantes (que están sueltos o en su propia línea): [G] -> <span class="chord">[G]</span>
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
  // En el editor Quill, las secciones DEBEN estar entre corchetes para ser coloreadas
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