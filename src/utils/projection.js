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
 * @param {{keepSections?: boolean}} opts  conservar etiquetas de sección (default: false)
 */
export function cleanLyricsForProjection(lyrics, opts = {}) {
  if (!lyrics) return '';
  const keepSections = !!opts.keepSections;

  let text = htmlToPlain(String(lyrics));

  const out = [];
  for (const raw of text.split('\n')) {
    // 1) fuera acordes entre corchetes (inline o en su línea)
    let line = raw.replace(/\[[^\]]*\]/g, ' ');
    line = line.replace(/[ \t]+/g, ' ').replace(/^[ \t]+|[ \t]+$/g, '');

    // 2) línea de sección: se conserva normalizada o se convierte en corte
    if (SECTION_LINE_RE.test(raw.trim()) || (line && SECTION_LINE_RE.test(line))) {
      if (keepSections) {
        const label = (line || raw).replace(/[[\]:]/g, '').trim().toUpperCase();
        out.push('');
        out.push(label);
      } else {
        out.push(''); // la sección desaparece pero garantiza el salto de diapositiva
      }
      continue;
    }

    // 3) línea que era solo acordes (con o sin corchetes) → fuera
    if (!line) {
      out.push('');
      continue;
    }
    if (isChordOnlyLine(line)) continue;

    out.push(line);
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
