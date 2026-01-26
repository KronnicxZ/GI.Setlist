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
app.use(express.json());

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
                channelTitle: snippet.channelTitle,
                durationRaw: contentDetails.duration
            });
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } catch (err) {
        console.error('YouTube Proxy Error:', err.message);
        res.status(500).json({ error: 'Error fetching video details' });
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
