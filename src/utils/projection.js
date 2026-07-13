// ─────────────────────────────────────────────────────────────────────────
// Limpieza de letra para PROYECCIÓN (Holyrics y similares).
//
// Las letras en la BD vienen en dos formatos (misma columna, dos apps):
//   · HTML de Quill (GI.Setlist): <p>línea</p>, <p><br></p>, spans de color…
//   · Texto plano de LivePads: saltos \n, acordes [G] inline o en líneas
//     propias ("F#m - E - D - A"), secciones [CORO] / "VERSO 1:".
//
// Holyrics pega texto plano y corta las diapositivas por LÍNEAS EN BLANCO.
// Esta util produce exactamente eso: solo la letra cantable, bloques
// separados por una línea en blanco, sin acordes ni etiquetas técnicas.
// ─────────────────────────────────────────────────────────────────────────

// Palabras de sección (encabezados técnicos, no cantables).
const SECTION_WORDS =
  '(?:pre[- ]?)?(?:verso|coro|puente|intro|outro|solo|instrumental|interludio|estribillo|bridge|chorus|verse|tag|ending|final|refr[aá]n)';
const SECTION_LINE_RE = new RegExp(
  `^\\s*\\[?\\s*${SECTION_WORDS}(?:\\s+[ivx0-9]+)?\\s*\\]?\\s*:?\\s*$`,
  'i'
);
// Encabezado de sección AL INICIO de una línea con más contenido detrás
// (p. ej. "INTRO: A - D - A - F#m"): captura la etiqueta y deja el resto para
// analizarlo aparte (si el resto son acordes, se descarta).
const SECTION_PREFIX_RE = new RegExp(
  `^\\s*\\[?\\s*(${SECTION_WORDS}(?:\\s+[ivx0-9]+)?)\\s*\\]?\\s*:\\s*(.*)$`,
  'i'
);

// Nota/acorde suelto (sin corchetes): C, F#m7, Bb/D, Asus4, C#m7b5, DO#m…
const CHORD_WORD_RE =
  /^[A-G](?:b|#)?(?:maj|min|m|M|aug|dim|sus|add|Δ|º|°|ø)?[0-9]*(?:sus[24]|add[0-9]+)?(?:[(#b0-9)+]+)?(?:\/[A-G](?:b|#)?)?$/;

// ¿La línea es SOLO acordes/separadores? (p. ej. "F#m - E - D - A", "| C / / / |",
// "A D A F#m", "Am F6 C x2"). Si tras quitar acordes y separadores no queda
// nada "cantable", es una línea de acordes y se elimina entera.
function isChordOnlyLine(line) {
  const tokens = line
    .replace(/[|/\\\-–—.,()~•:]+/g, ' ') // separadores comunes de cifrado
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return false;
  let chordish = 0;
  for (const tk of tokens) {
    if (CHORD_WORD_RE.test(tk) || /^x\d+$/i.test(tk) || /^\d+$/.test(tk)) chordish++;
    else return false; // hay una palabra real → es letra
  }
  return chordish > 0;
}

// Quita una COLA de acordes pegada al final de una línea de letra
// (p. ej. "Esperándote a ti F#m - E - D - A" → "Esperándote a ti").
// Conservador para no comerse letra real: la cola debe tener ≥2 tokens de
// acorde consecutivos y al menos uno inequívoco (con #/b/m/número/bajo) o un
// guion separador — así "vuelvo a Ti" o un "A" suelto nunca se recortan.
function stripTrailingChordRun(line) {
  const tokens = line.split(/\s+/);
  let i = tokens.length;
  while (i > 0) {
    const tk = tokens[i - 1];
    if (CHORD_WORD_RE.test(tk) || /^[-–—|/]+$/.test(tk) || /^x\d+$/i.test(tk)) i--;
    else break;
  }
  const run = tokens.slice(i);
  const chordTokens = run.filter((tk) => CHORD_WORD_RE.test(tk));
  const hasStrongChord = run.some((tk) => /[#bmM0-9/]/.test(tk) && CHORD_WORD_RE.test(tk));
  const hasSeparator = run.some((tk) => /^[-–—|/]+$/.test(tk));
  if (i > 0 && chordTokens.length >= 2 && (hasStrongChord || hasSeparator)) {
    return tokens.slice(0, i).join(' ').replace(/[ \t]+$/, '');
  }
  return line;
}

// Normaliza una etiqueta de sección para mostrarla clara y compatible con
// Holyrics: "[CORO 2]", "[INTRO]".
function formatSectionLabel(label) {
  return `[${label.replace(/[[\]:]/g, '').trim().toUpperCase()}]`;
}

// HTML (Quill) → texto plano con \n. Idéntico criterio que LivePads.
function htmlToPlain(html) {
  if (!/<\/?[a-z][\s\S]*>/i.test(html)) return html;
  let text = html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|li)\s*>/gi, '\n')
    .replace(/<\s*(p|div|li)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/gi, "'");
}

/**
 * Devuelve la letra lista para pegar en Holyrics.
 * @param {string} lyrics  letra cruda (HTML o texto plano)
 * @param {{keepSections?: boolean}} opts  conservar etiquetas de sección
 *   como "[CORO]" (default: TRUE — se quitan con la opción, no al revés)
 */
export function cleanLyricsForProjection(lyrics, opts = {}) {
  if (!lyrics) return '';
  const keepSections = opts.keepSections !== false; // default: etiquetas visibles

  let text = htmlToPlain(String(lyrics));

  const out = [];
  // Tras una etiqueta, se "tragan" las líneas en blanco del original para que
  // la etiqueta encabece su bloque (y no quede como diapositiva suelta).
  let afterLabel = false;
  const pushLabel = (label) => {
    out.push('');
    out.push(formatSectionLabel(label));
    afterLabel = true;
  };
  const pushLine = (l) => {
    out.push(l);
    if (l) afterLabel = false;
  };

  for (const raw of text.split('\n')) {
    const rawTrim = raw.trim();

    // 1) fuera acordes entre corchetes (inline o en su línea) — pero OJO: si el
    //    corchete es una sección ([CORO]), la maneja el paso 2 sobre `raw`.
    let line = raw.replace(/\[[^\]]*\]/g, ' ');
    line = line.replace(/[ \t]+/g, ' ').replace(/^[ \t]+|[ \t]+$/g, '');

    // 2) línea que ES una sección ("[CORO]", "VERSO 1:", "Intro")
    if (SECTION_LINE_RE.test(rawTrim) || (line && SECTION_LINE_RE.test(line))) {
      if (keepSections) pushLabel(line || rawTrim);
      else pushLine(''); // la sección desaparece pero garantiza el salto de bloque
      continue;
    }

    // 2b) sección CON contenido detrás ("INTRO: A - D - A - F#m"): etiqueta
    //     aparte; el resto solo sobrevive si es letra real (no cifrado).
    const prefixMatch = (line || rawTrim).match(SECTION_PREFIX_RE);
    if (prefixMatch) {
      const [, label, rest] = prefixMatch;
      if (keepSections) pushLabel(label);
      else pushLine('');
      const restClean = rest.trim();
      if (restClean && !isChordOnlyLine(restClean)) {
        pushLine(stripTrailingChordRun(restClean));
      }
      continue;
    }

    // 3) línea en blanco DEL AUTOR → corte de bloque (salvo justo tras una
    //    etiqueta, para no separarla de su letra). Una línea que quedó vacía
    //    por quitarle los [acordes] NO es un corte: era una línea de cifrado.
    if (!line) {
      if (rawTrim === '') {
        if (!afterLabel) out.push('');
      }
      continue;
    }
    if (isChordOnlyLine(line)) continue;

    // 4) letra con cola de acordes al final → recorta la cola. Si lo que queda
    //    es una etiqueta ("INTRO A - D - A - F#m" sin dos puntos), trátala como tal.
    const stripped = stripTrailingChordRun(line);
    if (SECTION_LINE_RE.test(stripped)) {
      if (keepSections) pushLabel(stripped);
      else pushLine('');
      continue;
    }
    pushLine(stripped);
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // Holyrics: UNA línea en blanco = nueva diapositiva
    .trim();
}

/** Copia texto al portapapeles con fallback para contextos sin Clipboard API. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(temp);
    return ok;
  }
}
