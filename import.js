require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const fs = require('fs');
const csv = require('csv-parser');
const Song = require('./server/models/Song');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB. Starting import...');
        const results = [];
        
        fs.createReadStream('songs_rows.csv')
            .pipe(csv())
            .on('data', (data) => {
                results.push({
                    title: data.title,
                    artist: data.artist,
                    lyrics: data.lyrics,
                    bpm: data.bpm,
                    key: data.key,
                    originalKey: data.key, // fallback to key
                    notes: data.notes,
                    genre: data.genre,
                    youtubeUrl: data.youtubeUrl
                });
            })
            .on('end', async () => {
                try {
                    await Song.deleteMany({}); // clear first config
                    console.log('Cleared existing songs');
                    await Song.insertMany(results);
                    console.log(`Successfully imported ${results.length} songs`);
                    process.exit(0);
                } catch (error) {
                    console.error('Error importing:', error);
                    process.exit(1);
                }
            });
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
