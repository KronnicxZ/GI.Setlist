const mongoose = require('mongoose');

const setlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    date: Date,
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setlist', setlistSchema);
