require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const db = require('./db');

const app = express();

// ── CORS restringido ──────────────────────────────────────────────────────
// Frontend y backend van en el MISMO origen (deploy unificado en Vercel), así
// que las peticiones de la app son same-origin y no dependen de CORS. Esto solo
// limita quién puede llamar la API desde OTRO sitio en un navegador. Configurable
// con ALLOWED_ORIGINS (lista separada por comas).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://gi-setlist.vercel.app')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // Sin origin = same-origin / curl / apps nativas → permitido.
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Log de peticiones — solo en desarrollo (en prod ensucia los logs de Vercel).
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ── Auth de admin ───────────────────────────────────────────────────────────
// Token determinístico derivado de ADMIN_PASSWORD: estable entre invocaciones
// serverless (no requiere una env var nueva) y nunca expone la contraseña. El
// frontend lo recibe al iniciar sesión y lo envía en el header `x-admin-token`.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
function adminToken() {
  if (!ADMIN_PASSWORD) return null;
  return crypto.createHash('sha256').update(`${ADMIN_PASSWORD}:gi-setlist-admin-v1`).digest('hex');
}
// Middleware: protege las rutas de escritura / costosas. Falla cerrado si no hay
// ADMIN_PASSWORD configurada en el servidor.
function requireAdmin(req, res, next) {
  const expected = adminToken();
  if (!expected)
    return res
      .status(503)
      .json({ error: 'Admin no configurado en el servidor (falta ADMIN_PASSWORD)' });
  if (req.header('x-admin-token') !== expected)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (Supabase)`));
}

module.exports = app;

// ── Auth ────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ success: false, message: 'Admin no configurado en el servidor' });
  }
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, isAdmin: true, token: adminToken() });
  }
  return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});

// ── YouTube Proxy ─────────────────────────────────────────────────────────
// ── Proxies para la app GI Setlist v2 en navegador ───────────────────────────
// El <audio> del navegador exige CORS al bucket R2 y las webs de acordes no
// permiten lectura cross-origin; la app nativa (APK) no pasa por aquí.
const R2_HOST = /\.r2\.cloudflarestorage\.com$/;
app.get('/api/r2', async (req, res) => {
  let target;
  try { target = new URL(String(req.query.u || '')); } catch (_) { return res.status(400).json({ error: 'URL inválida' }); }
  if (target.protocol !== 'https:' || !R2_HOST.test(target.hostname)) return res.status(403).json({ error: 'Host no permitido' });
  try {
    const up = await axios.get(target.toString(), {
      responseType: 'stream', timeout: 60000, validateStatus: () => true,
      headers: req.headers.range ? { Range: req.headers.range } : {},
    });
    res.status(up.status);
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag']) {
      if (up.headers[h]) res.setHeader(h, up.headers[h]);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'private, max-age=300');
    up.data.pipe(res);
  } catch (e) {
    res.status(502).json({ error: 'Proxy: ' + e.message });
  }
});

app.get('/api/fetch', async (req, res) => {
  let target;
  try { target = new URL(String(req.query.u || '')); } catch (_) { return res.status(400).json({ error: 'URL inválida' }); }
  if (!/^https?:$/.test(target.protocol)) return res.status(400).json({ error: 'Esquema no permitido' });
  try {
    const up = await axios.get(target.toString(), {
      // Se recibe como flujo: los PDF pasan tal cual (en streaming, sin límite de tamaño); el texto se junta y se
      // decodifica como UTF-8 igual que antes.
      responseType: 'stream', timeout: 20000, validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    const ct = String(up.headers['content-type'] || '');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const isPdf = /pdf/i.test(ct) || /\.pdf(\?|$)/i.test(target.pathname);
    if (isPdf || /^(image|audio|video|application\/(octet-stream|zip))/i.test(ct)) {
      res.status(up.status).setHeader('Content-Type', isPdf ? 'application/pdf' : ct);
      if (up.headers['content-length']) res.setHeader('Content-Length', up.headers['content-length']);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return up.data.pipe(res);
    }
    const chunks = [];
    let size = 0;
    for await (const c of up.data) {
      size += c.length;
      if (size > 3 * 1024 * 1024) { up.data.destroy(); return res.status(413).json({ error: 'Página demasiado grande' }); }
      chunks.push(c);
    }
    res.status(up.status).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(Buffer.concat(chunks).toString('utf8'));
  } catch (e) {
    res.status(502).json({ error: 'Proxy: ' + e.message });
  }
});

// ── GI App: guardar el orden del programa de un servicio ─────────────────────
// La app manda su token de sesión de Supabase; aquí se comprueba quién es y que pueda editar esa iglesia
// (dueño o editor) y se guardan TODAS las posiciones con la clave de servidor. Si la persona es la dueña de la
// iglesia pero le faltaba su fila de miembro (por eso la base de datos rechazaba sus cambios), se repara.
app.post('/api/gi/reorder', async (req, res) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const { serviceId, ids } = req.body || {};
    if (!token) return res.status(401).json({ error: 'Falta la sesión' });
    if (!serviceId || !Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) return res.status(400).json({ error: 'Datos incompletos' });
    const sb = db.supabase;
    const { data: u, error: ue } = await sb.auth.getUser(token);
    if (ue || !u || !u.user) return res.status(401).json({ error: 'Sesión vencida: vuelve a iniciar sesión' });
    const uid = u.user.id;
    const { data: svc, error: se } = await sb.from('services').select('id, library_id').eq('id', serviceId).maybeSingle();
    if (se) throw se;
    if (!svc) return res.status(404).json({ error: 'El servicio ya no existe' });
    const lib = svc.library_id;
    const { data: mem } = await sb.from('memberships').select('role').eq('library_id', lib).eq('user_id', uid).maybeSingle();
    let repaired = false;
    if (!mem || !['owner', 'editor'].includes(mem.role)) {
      const { data: l } = await sb.from('libraries').select('owner_id').eq('id', lib).maybeSingle();
      if (!l || l.owner_id !== uid) return res.status(403).json({ error: 'No tienes permiso para editar este programa (pide rol de editor)' });
      await sb.from('memberships').upsert({ library_id: lib, user_id: uid, role: 'owner' }, { onConflict: 'library_id,user_id' });
      repaired = true;
    }
    const { data: items, error: ie } = await sb.from('service_items').select('id').eq('service_id', serviceId);
    if (ie) throw ie;
    const known = new Set(items.map((i) => i.id));
    const order = [...ids.filter((id) => known.has(id)), ...items.map((i) => i.id).filter((id) => !ids.includes(id))];
    const results = await Promise.all(order.map((id, i) => sb.from('service_items').update({ position: i }).eq('id', id)));
    const bad = results.find((r) => r.error);
    if (bad) throw bad.error;
    res.json({ ok: true, order, repaired });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo guardar el orden: ' + (e.message || e) });
  }
});

// ── GI App: acordes detectados de videos de YouTube ─────────────────────────
// La app escanea el video escuchándolo (reproductor oficial + micrófono) y guarda aquí el resultado para que el
// resto del equipo no tenga que volver a escanearlo. Se guarda como JSON en Supabase Storage (bucket privado
// «gi-chords», se crea solo). Solo usuarios con sesión; un escaneo más completo nunca se reemplaza por uno parcial.
const CHORD_BUCKET = 'gi-chords';
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
async function sessionUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await db.supabase.auth.getUser(token);
  return error || !data || !data.user ? null : data.user;
}
async function readChords(vid) {
  const { data, error } = await db.supabase.storage.from(CHORD_BUCKET).download(`yt/${vid}.json`);
  if (error || !data) return null;
  try { return JSON.parse(Buffer.from(await data.arrayBuffer()).toString('utf8')); } catch (_) { return null; }
}
app.get('/api/gi/chords/:vid', async (req, res) => {
  try {
    const vid = req.params.vid;
    if (!YT_ID.test(vid)) return res.status(400).json({ error: 'Video no válido' });
    if (!(await sessionUser(req))) return res.status(401).json({ error: 'Inicia sesión para ver los acordes guardados' });
    const doc = await readChords(vid);
    if (!doc) return res.status(404).json({ error: 'Este video aún no tiene acordes' });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron leer los acordes: ' + (e.message || e) });
  }
});
app.post('/api/gi/chords/:vid', async (req, res) => {
  try {
    const vid = req.params.vid;
    if (!YT_ID.test(vid)) return res.status(400).json({ error: 'Video no válido' });
    const user = await sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Inicia sesión para guardar los acordes' });
    const { analysis, coverage, title } = req.body || {};
    const cov = Math.max(0, Math.min(1, Number(coverage) || 0));
    if (!analysis || typeof analysis !== 'object' || !Array.isArray(analysis.seg) || !Array.isArray(analysis.beats) || !(Number(analysis.d) > 0)) {
      return res.status(400).json({ error: 'Datos de acordes incompletos' });
    }
    const body = JSON.stringify({ v: 1, coverage: cov, title: String(title || '').slice(0, 200), by: user.id, at: new Date().toISOString(), a: analysis });
    if (body.length > 600000) return res.status(413).json({ error: 'Demasiado grande' });
    const old = await readChords(vid);
    if (old && Number(old.coverage) > cov + 0.05) return res.json({ ok: true, kept: true, coverage: old.coverage });
    const up = () => db.supabase.storage.from(CHORD_BUCKET).upload(`yt/${vid}.json`, Buffer.from(body, 'utf8'), { contentType: 'application/json', upsert: true });
    let { error } = await up();
    if (error && /not.?found/i.test(error.message || '')) {
      await db.supabase.storage.createBucket(CHORD_BUCKET, { public: false });
      ({ error } = await up());
    }
    if (error) throw error;
    res.json({ ok: true, coverage: cov });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron guardar los acordes: ' + (e.message || e) });
  }
});

app.get('/api/youtube/details', async (req, res) => {
  const { videoId } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'Configuración del servidor incompleta (YouTube API)' });
  if (!videoId) return res.status(400).json({ error: 'Video ID is required' });
  try {
    const snippetRes = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`
    );
    if (snippetRes.data.items && snippetRes.data.items.length > 0) {
      const snippet = snippetRes.data.items[0].snippet;
      res.json({ title: snippet.title, channelTitle: snippet.channelTitle });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }
  } catch (err) {
    console.error('YouTube Proxy Error:', err.message);
    res.status(500).json({ error: 'Error fetching video details' });
  }
});

// ── IA: generar acordes ─────────────────────────────────────────────────────
app.post('/api/ai/generate-chords', requireAdmin, async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) return res.status(400).json({ error: 'Title and artist are required' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const prompt = `Actúa como un músico profesional experto en transcribir acordes.
Escribe la letra completa con los acordes para la canción "${title}" de "${artist}".

REGLAS ESTRICTAS DE FORMATO:
1. Escribe los nombres de las secciones en una línea propia y entre corchetes, por ejemplo: [INTRO], [VERSO 1], [CORO], [PUENTE].
2. Los acordes DEBEN estar encerrados entre corchetes y DEBEN estar pegados JUSTO ANTES de la sílaba o palabra donde cambian, en la misma línea que la letra.
   Ejemplo de formato correcto:
   [G]Cuan grande es [C]Él
3. Usa cifrado americano (C, Dm, G, F#m, etc.).
4. Proporciona el BPM (Tempo) y la Tonalidad Original (Key) EXACTOS de la canción. Si no estás seguro, busca en tu base de conocimiento el tempo oficial reportado para esta versión. Ejemplo: "94" en lugar de "70".
5. Si detectas que la canción tiene un tempo de 1/2 o el doble, proporciona el tempo real (ej: si es 94 no pongas 47).
6. Devuelve ÚNICAMENTE un objeto JSON válido (sin Markdown) con esta estructura exacta:
{
  "lyrics": "la letra con los acordes inline aquí bajo todas las reglas anteriores",
  "bpm": "94",
  "key": "G"
}`;

  try {
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    if (groqResponse.data.choices && groqResponse.data.choices.length > 0) {
      let content = groqResponse.data.choices[0].message.content;
      content = content
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      return res.json(JSON.parse(content));
    }
  } catch (err) {
    console.warn('Groq failed, falling back to OpenRouter...', err.message);
    try {
      const fallbackResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'GI Setlist',
            'Content-Type': 'application/json',
          },
        }
      );
      if (fallbackResponse.data.choices && fallbackResponse.data.choices.length > 0) {
        let content = fallbackResponse.data.choices[0].message.content;
        content = content
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        return res.json(JSON.parse(content));
      }
      return res.status(500).json({ error: 'Error from OpenRouter AI service' });
    } catch (fallbackErr) {
      console.error(
        'OpenRouter Fallback Error:',
        fallbackErr.response ? fallbackErr.response.data : fallbackErr.message
      );
      return res
        .status(500)
        .json({ error: 'Error generating chords with both Groq and OpenRouter' });
    }
  }
});

// ── Canciones (Supabase) ─────────────────────────────────────────────────────
app.get('/api/songs', async (req, res) => {
  try {
    res.json(await db.listSongs());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/songs/:id', async (req, res) => {
  try {
    const song = await db.getSong(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/songs', requireAdmin, async (req, res) => {
  try {
    res.status(201).json(await db.createSong(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/songs/:id', requireAdmin, async (req, res) => {
  try {
    res.json(await db.updateSong(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/songs/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteSong(req.params.id);
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Setlists (Supabase) ───────────────────────────────────────────────────
app.get('/api/setlists', async (req, res) => {
  try {
    res.json(await db.listSetlists());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/setlists', requireAdmin, async (req, res) => {
  try {
    res.status(201).json(await db.createSetlist(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/setlists/:id', requireAdmin, async (req, res) => {
  try {
    res.json(await db.updateSetlist(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/setlists/:id', requireAdmin, async (req, res) => {
  try {
    await db.deleteSetlist(req.params.id);
    res.json({ message: 'Setlist deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta pública para compartir setlists (sin auth)
app.get('/api/public/setlists/:id', async (req, res) => {
  try {
    const setlist = await db.getSetlist(req.params.id);
    if (!setlist) return res.status(404).json({ error: 'Setlist no encontrado' });
    res.json(setlist);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener setlist público' });
  }
});

// ── Backup / Restore ────────────────────────────────────────────────────────
app.get('/api/backup', requireAdmin, async (req, res) => {
  try {
    const songs = await db.listSongs();
    const setlists = await db.listSetlists();
    res.json({ version: '1.0', timestamp: new Date().toISOString(), data: { songs, setlists } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/restore', requireAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !data.songs || !data.setlists)
      return res.status(400).json({ error: 'Formato de backup inválido' });
    await db.replaceAll(data.songs, data.setlists);
    res.json({
      message: 'Base de datos restaurada con éxito',
      count: { songs: data.songs.length, setlists: data.setlists.length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── IA: chat asistente ──────────────────────────────────────────────────────
app.post('/api/ai/chat', requireAdmin, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: 'Messages array is required' });
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  try {
    const songs = await db.listSongs();
    const songList = songs
      .map((s) => `${s.title} - ${s.artist} (Tono: ${s.key}, BPM: ${s.bpm})`)
      .join('\n');
    const systemPrompt = `Eres GI Setlist Assistant, un experto musical en música Cristiana (Worship, Alabanza y Adoración).
Tu objetivo es ayudar al usuario con recomendaciones musicales, progresiones, buscar información de BPMs o tonos, y armar setlists o iterar acordes.
SIEMPRE debes dar recomendaciones basándote en el ámbito Cristiano y Worship preferiblemente.

Aquí está la lista de canciones que el usuario tiene actualmente en su base de datos local:
${songList || 'La base de datos está vacía.'}

Cuando el usuario te pida sugerencias (por ejemplo: "¿Qué canción quedaría bien con X?" o "¿Qué canción habla sobre Y?"), revisa primero esta lista de su base de datos para sugerirle opciones que ya tiene, y siéntete libre de sugerir también otras canciones cristianas famosas que no estén en la lista si son muy adecuadas.`;
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
      },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    if (groqResponse.data.choices && groqResponse.data.choices.length > 0) {
      return res.json({ response: groqResponse.data.choices[0].message.content });
    }
    return res.status(500).json({ error: 'No response from Groq' });
  } catch (err) {
    console.error('Groq Chat Error:', err.message);
    return res.status(500).json({ error: 'Error generating chat response' });
  }
});
