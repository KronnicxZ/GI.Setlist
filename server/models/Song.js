const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    lyrics: String,
    bpm: String,
    notes: String,
    key: String,
    originalKey: String,
    vocalistKey: String,
    duration: String, // format "mm:ss"
    genre: String,
    youtubeUrl: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', songSchema);
