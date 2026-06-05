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
    .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
    origin(origin, cb) {
        // Sin origin = same-origin / curl / apps nativas → permitido.
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        return cb(null, false);
    },
}));
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
    if (!expected) return res.status(503).json({ error: 'Admin no configurado en el servidor (falta ADMIN_PASSWORD)' });
    if (req.header('x-admin-token') !== expected) return res.status(401).json({ error: 'No autorizado' });
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
app.get('/api/youtube/details', async (req, res) => {
    const { videoId } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Configuración del servidor incompleta (YouTube API)' });
    if (!videoId) return res.status(400).json({ error: 'Video ID is required' });
    try {
        const snippetRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`);
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
            { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 2000 },
            { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
        );
        if (groqResponse.data.choices && groqResponse.data.choices.length > 0) {
            let content = groqResponse.data.choices[0].message.content;
            content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            return res.json(JSON.parse(content));
        }
    } catch (err) {
        console.warn('Groq failed, falling back to OpenRouter...', err.message);
        try {
            const fallbackResponse = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                { model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 2000 },
                { headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'GI Setlist', 'Content-Type': 'application/json' } }
            );
            if (fallbackResponse.data.choices && fallbackResponse.data.choices.length > 0) {
                let content = fallbackResponse.data.choices[0].message.content;
                content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
                return res.json(JSON.parse(content));
            }
            return res.status(500).json({ error: 'Error from OpenRouter AI service' });
        } catch (fallbackErr) {
            console.error('OpenRouter Fallback Error:', fallbackErr.response ? fallbackErr.response.data : fallbackErr.message);
            return res.status(500).json({ error: 'Error generating chords with both Groq and OpenRouter' });
        }
    }
});

// ── Canciones (Supabase) ─────────────────────────────────────────────────────
app.get('/api/songs', async (req, res) => {
    try { res.json(await db.listSongs()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/songs/:id', async (req, res) => {
    try {
        const song = await db.getSong(req.params.id);
        if (!song) return res.status(404).json({ error: 'Song not found' });
        res.json(song);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/songs', requireAdmin, async (req, res) => {
    try { res.status(201).json(await db.createSong(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/songs/:id', requireAdmin, async (req, res) => {
    try { res.json(await db.updateSong(req.params.id, req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/songs/:id', requireAdmin, async (req, res) => {
    try { await db.deleteSong(req.params.id); res.json({ message: 'Song deleted' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Setlists (Supabase) ───────────────────────────────────────────────────
app.get('/api/setlists', async (req, res) => {
    try { res.json(await db.listSetlists()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/setlists', requireAdmin, async (req, res) => {
    try { res.status(201).json(await db.createSetlist(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/setlists/:id', requireAdmin, async (req, res) => {
    try { res.json(await db.updateSetlist(req.params.id, req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/setlists/:id', requireAdmin, async (req, res) => {
    try { await db.deleteSetlist(req.params.id); res.json({ message: 'Setlist deleted' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

// Ruta pública para compartir setlists (sin auth)
app.get('/api/public/setlists/:id', async (req, res) => {
    try {
        const setlist = await db.getSetlist(req.params.id);
        if (!setlist) return res.status(404).json({ error: 'Setlist no encontrado' });
        res.json(setlist);
    } catch (err) { res.status(500).json({ error: 'Error al obtener setlist público' }); }
});

// ── Backup / Restore ────────────────────────────────────────────────────────
app.get('/api/backup', requireAdmin, async (req, res) => {
    try {
        const songs = await db.listSongs();
        const setlists = await db.listSetlists();
        res.json({ version: '1.0', timestamp: new Date().toISOString(), data: { songs, setlists } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/restore', requireAdmin, async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !data.songs || !data.setlists) return res.status(400).json({ error: 'Formato de backup inválido' });
        await db.replaceAll(data.songs, data.setlists);
        res.json({ message: 'Base de datos restaurada con éxito', count: { songs: data.songs.length, setlists: data.setlists.length } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── IA: chat asistente ──────────────────────────────────────────────────────
app.post('/api/ai/chat', requireAdmin, async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array is required' });
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    try {
        const songs = await db.listSongs();
        const songList = songs.map(s => `${s.title} - ${s.artist} (Tono: ${s.key}, BPM: ${s.bpm})`).join('\n');
        const systemPrompt = `Eres GI Setlist Assistant, un experto musical en música Cristiana (Worship, Alabanza y Adoración).
Tu objetivo es ayudar al usuario con recomendaciones musicales, progresiones, buscar información de BPMs o tonos, y armar setlists o iterar acordes.
SIEMPRE debes dar recomendaciones basándote en el ámbito Cristiano y Worship preferiblemente.

Aquí está la lista de canciones que el usuario tiene actualmente en su base de datos local:
${songList || "La base de datos está vacía."}

Cuando el usuario te pida sugerencias (por ejemplo: "¿Qué canción quedaría bien con X?" o "¿Qué canción habla sobre Y?"), revisa primero esta lista de su base de datos para sugerirle opciones que ya tiene, y siéntete libre de sugerir también otras canciones cristianas famosas que no estén en la lista si son muy adecuadas.`;
        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            { model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemPrompt }, ...messages], temperature: 0.7, max_tokens: 1500 },
            { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
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
