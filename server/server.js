require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Forzar el uso de los servidores DNS de Google para resolver el registro SRV de MongoDB
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Log de peticiones (Simplificado)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gi-setlist';

console.log('Intentando conectar a MongoDB...');
const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@');
console.log('URI:', maskedUri);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('❌ Error connecting to MongoDB:', err.message);
    });

const Song = require('./models/Song');
const Setlist = require('./models/Setlist');

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

module.exports = app;

// Auth Routes
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'H8e5n14r19y251';

    if (password === adminPassword) {
        res.json({ success: true, isAdmin: true });
    } else {
        res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }
});

// YouTube Proxy Route
app.get('/api/youtube/details', async (req, res) => {
    const { videoId } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error('YOUTUBE_API_KEY is not defined in environment');
        return res.status(500).json({ error: 'Configuración del servidor incompleta (YouTube API)' });
    }

    if (!videoId) return res.status(400).json({ error: 'Video ID is required' });

    try {
        const [snippetRes, contentRes] = await Promise.all([
            axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`),
            axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`)
        ]);

        if (snippetRes.data.items && snippetRes.data.items.length > 0) {
            const snippet = snippetRes.data.items[0].snippet;
            const contentDetails = contentRes.data.items[0].contentDetails;

            res.json({
                title: snippet.title,
                channelTitle: snippet.channelTitle
            });
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } catch (err) {
        console.error('YouTube Proxy Error:', err.message);
        res.status(500).json({ error: 'Error fetching video details' });
    }
});

// AI Chord Generation using Groq & OpenRouter Fallback
app.post('/api/ai/generate-chords', async (req, res) => {
    const { title, artist } = req.body;
    
    if (!title || !artist) {
        return res.status(400).json({ error: 'Title and artist are required' });
    }

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
        // First try: Groq (Blazing fast Llama 3)
        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (groqResponse.data.choices && groqResponse.data.choices.length > 0) {
            let content = groqResponse.data.choices[0].message.content;
            content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonResp = JSON.parse(content);
            return res.json(jsonResp);
        }
    } catch (err) {
        console.warn('Groq failed, falling back to OpenRouter...', err.message);
        
        try {
            // Fallback: OpenRouter
            const fallbackResponse = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'google/gemini-2.5-flash',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'GI Setlist',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (fallbackResponse.data.choices && fallbackResponse.data.choices.length > 0) {
                let content = fallbackResponse.data.choices[0].message.content;
                content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
                const jsonResp = JSON.parse(content);
                return res.json(jsonResp);
            } else {
                return res.status(500).json({ error: 'Error from OpenRouter AI service' });
            }
        } catch (fallbackErr) {
            console.error('OpenRouter Fallback Error:', fallbackErr.response ? fallbackErr.response.data : fallbackErr.message);
            return res.status(500).json({ error: 'Error generating chords with both Groq and OpenRouter' });
        }
    }
});

// API Routes for Songs
app.get('/api/songs', async (req, res) => {
    try {
        const songs = await Song.find();
        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/songs/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ error: 'Song not found' });
        res.json(song);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/songs', async (req, res) => {
    try {
        const newSong = new Song(req.body);
        await newSong.save();
        res.status(201).json(newSong);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/songs/:id', async (req, res) => {
    try {
        const updatedSong = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSong);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/songs/:id', async (req, res) => {
    try {
        await Song.findByIdAndDelete(req.params.id);
        res.json({ message: 'Song deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Routes for Setlists
app.get('/api/setlists', async (req, res) => {
    try {
        const setlists = await Setlist.find().populate('songs');
        res.json(setlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/setlists', async (req, res) => {
    try {
        const newSetlist = new Setlist(req.body);
        await newSetlist.save();
        res.status(201).json(newSetlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/setlists/:id', async (req, res) => {
    try {
        const updatedSetlist = await Setlist.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSetlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/setlists/:id', async (req, res) => {
    try {
        await Setlist.findByIdAndDelete(req.params.id);
        res.json({ message: 'Setlist deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Routes for Backup & Restore
app.get('/api/backup', async (req, res) => {
    try {
        const songs = await Song.find();
        const setlists = await Setlist.find();
        res.json({
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: { songs, setlists }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/restore', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !data.songs || !data.setlists) {
            return res.status(400).json({ error: 'Formato de backup inválido' });
        }

        // Limpiar base de datos actual antes de restaurar
        await Song.deleteMany({});
        await Setlist.deleteMany({});

        // Insertar datos restaurados
        if (data.songs.length > 0) await Song.insertMany(data.songs);
        if (data.setlists.length > 0) await Setlist.insertMany(data.setlists);

        res.json({
            message: 'Base de datos restaurada con éxito',
            count: { songs: data.songs.length, setlists: data.setlists.length }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Chat Tool Route
app.post('/api/ai/chat', async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    try {
        // Fetch current songs from DB to give context
        const songs = await Song.find({}, 'title artist genre key bpm lyrics');
        const songList = songs.map(s => `${s.title} - ${s.artist} (Tono: ${s.key}, BPM: ${s.bpm})`).join('\n');
        
        const systemPrompt = `Eres GI Setlist Assistant, un experto musical en música Cristiana (Worship, Alabanza y Adoración).
Tu objetivo es ayudar al usuario con recomendaciones musicales, progresiones, buscar información de BPMs o tonos, y armar setlists o iterar acordes.
SIEMPRE debes dar recomendaciones basándote en el ámbito Cristiano y Worship preferiblemente.

Aquí está la lista de canciones que el usuario tiene actualmente en su base de datos local:
${songList || "La base de datos está vacía."}

Cuando el usuario te pida sugerencias (por ejemplo: "¿Qué canción quedaría bien con X?" o "¿Qué canción habla sobre Y?"), revisa primero esta lista de su base de datos para sugerirle opciones que ya tiene, y siéntete libre de sugerir también otras canciones cristianas famosas que no estén en la lista si son muy adecuadas.`;

        const axios = require('axios');
        const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1500
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (groqResponse.data.choices && groqResponse.data.choices.length > 0) {
            return res.json({ response: groqResponse.data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: 'No response from Groq' });
        }
    } catch (err) {
        console.error('Groq Chat Error:', err.message);
        return res.status(500).json({ error: 'Error generating chat response' });
    }
});
