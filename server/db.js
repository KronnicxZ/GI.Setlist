// ─────────────────────────────────────────────────────────────────────────
// Capa de datos sobre Supabase (sustituye a MongoDB/Mongoose).
//
// GI.Setlist ahora comparte la MISMA tabla `songs` de LivePads (fuente única).
// Todas sus canciones/setlists viven en una librería dedicada (GISETLIST_LIBRARY_ID).
// El servidor usa la SERVICE_ROLE key (solo backend) → se salta RLS.
//
// El frontend de GI.Setlist no cambia: mapeamos `id` de Supabase a `_id` y
// aplanamos los campos extra (youtube_url → youtubeUrl, etc.).
// ─────────────────────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIBRARY_ID = process.env.GISETLIST_LIBRARY_ID;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('⚠️  Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}
if (!LIBRARY_ID) {
  console.error('⚠️  Falta GISETLIST_LIBRARY_ID (id de la librería maestra).');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Mapeo canción: fila Supabase ↔ objeto GI.Setlist ───────────────────────
function rowToSong(r) {
  if (!r) return null;
  return {
    _id: r.id,
    title: r.title,
    artist: r.artist,
    lyrics: r.lyrics,
    bpm: r.bpm,
    notes: r.notes,
    key: r.key,
    originalKey: r.original_key,
    vocalistKey: r.vocalist_key,
    genre: r.genre,
    youtubeUrl: r.youtube_url,
    duration: r.duration,
    createdAt: r.created_at,
  };
}

function songToRow(s) {
  const row = {
    library_id: LIBRARY_ID,
    title: s.title,
    artist: s.artist || null,
    lyrics: s.lyrics || null,
    bpm: s.bpm != null && s.bpm !== '' ? String(s.bpm) : null,
    notes: s.notes || null,
    key: s.key || null,
    original_key: s.originalKey || null,
    vocalist_key: s.vocalistKey || null,
    genre: s.genre || null,
    youtube_url: s.youtubeUrl || null,
    duration: s.duration != null && s.duration !== '' ? String(s.duration) : null,
  };
  return row;
}

// ── Mapeo setlist ───────────────────────────────────────────────────────────
function rowToSetlist(r, songsById) {
  if (!r) return null;
  const m = r.meta || {};
  const ids = Array.isArray(r.song_ids) ? r.song_ids : [];
  return {
    _id: r.id,
    name: r.name,
    description: m.description || '',
    date: m.date || null,
    // Si nos pasan el índice de canciones, devolvemos objetos "populados" en orden.
    songs: songsById ? ids.map((id) => songsById[id]).filter(Boolean) : ids,
    createdAt: r.created_at,
  };
}

function setlistToRow(s) {
  const songs = Array.isArray(s.songs) ? s.songs : [];
  const song_ids = songs.map((x) => (x && typeof x === 'object' ? (x._id || x.id) : x)).filter(Boolean);
  return {
    library_id: LIBRARY_ID,
    name: s.name,
    song_ids,
    meta: { description: s.description || null, date: s.date || null },
  };
}

// ── Canciones ───────────────────────────────────────────────────────────────
async function listSongs(columns = '*') {
  const { data, error } = await supabase
    .from('songs').select(columns).eq('library_id', LIBRARY_ID).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToSong);
}
async function getSong(id) {
  const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
  if (error) return null;
  return rowToSong(data);
}
async function createSong(body) {
  const { data, error } = await supabase.from('songs').insert(songToRow(body)).select('*').single();
  if (error) throw new Error(error.message);
  return rowToSong(data);
}
async function updateSong(id, body) {
  const { data, error } = await supabase.from('songs').update(songToRow(body)).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return rowToSong(data);
}
async function deleteSong(id) {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Setlists ──────────────────────────────────────────────────────────────
async function songsByIdMap() {
  const songs = await listSongs('*');
  const map = {};
  songs.forEach((s) => { map[s._id] = s; });
  return map;
}
async function listSetlists() {
  const { data, error } = await supabase
    .from('setlists').select('*').eq('library_id', LIBRARY_ID).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const map = await songsByIdMap();
  return (data || []).map((r) => rowToSetlist(r, map));
}
async function getSetlist(id) {
  const { data, error } = await supabase.from('setlists').select('*').eq('id', id).single();
  if (error) return null;
  const map = await songsByIdMap();
  return rowToSetlist(data, map);
}
async function createSetlist(body) {
  const { data, error } = await supabase.from('setlists').insert(setlistToRow(body)).select('*').single();
  if (error) throw new Error(error.message);
  return rowToSetlist(data, await songsByIdMap());
}
async function updateSetlist(id, body) {
  const { data, error } = await supabase.from('setlists').update(setlistToRow(body)).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return rowToSetlist(data, await songsByIdMap());
}
async function deleteSetlist(id) {
  const { error } = await supabase.from('setlists').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Backup / Restore ────────────────────────────────────────────────────────
async function replaceAll(songs, setlists) {
  // Borra todo lo de la librería y reinserta (como el restore de Mongo).
  await supabase.from('setlists').delete().eq('library_id', LIBRARY_ID);
  await supabase.from('songs').delete().eq('library_id', LIBRARY_ID);
  if (songs && songs.length) {
    const { error } = await supabase.from('songs').insert(songs.map(songToRow));
    if (error) throw new Error(error.message);
  }
  if (setlists && setlists.length) {
    const { error } = await supabase.from('setlists').insert(setlists.map(setlistToRow));
    if (error) throw new Error(error.message);
  }
}

module.exports = {
  supabase, LIBRARY_ID,
  rowToSong, songToRow, rowToSetlist, setlistToRow,
  listSongs, getSong, createSong, updateSong, deleteSong,
  listSetlists, getSetlist, createSetlist, updateSetlist, deleteSetlist,
  replaceAll,
};
