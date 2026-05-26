/**
 * Migración única: MongoDB → Supabase (tabla `songs`/`setlists` de LivePads).
 *
 * - Crea (o reutiliza) la librería maestra y te imprime su id para Vercel.
 * - Copia todas las canciones y setlists de Mongo a esa librería.
 * - Remapea las referencias de canciones en los setlists (ObjectId → uuid).
 *
 * Ejecutar localmente (NO se sube a producción):
 *   MONGODB_URI=...                          (tu cadena actual de Mongo Atlas)
 *   SUPABASE_URL=https://hmrviyzisgoovyttnsth.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...            (Supabase → Settings → API → service_role)
 *   OWNER_EMAIL=montillajose221@gmail.com    (dueño de la librería; debe existir en LivePads)
 *
 *   node migrate-to-supabase.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'montillajose221@gmail.com';
const LIBRARY_NAME = process.env.LIBRARY_NAME || 'Repertorio GI.Setlist';

function fail(msg) { console.error('❌ ' + msg); process.exit(1); }
if (!MONGODB_URI) fail('Falta MONGODB_URI');
if (!SUPABASE_URL || !SERVICE_ROLE) fail('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const songSchema = new mongoose.Schema({}, { strict: false, collection: 'songs' });
const setlistSchema = new mongoose.Schema({}, { strict: false, collection: 'setlists' });

function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

async function getOwnerId() {
  const { data, error } = await supabase.from('profiles').select('id,email').eq('email', OWNER_EMAIL).maybeSingle();
  if (error) fail('Buscando owner: ' + error.message);
  if (!data) fail(`No existe un usuario con el correo ${OWNER_EMAIL} en LivePads. Crea/inicia esa cuenta primero.`);
  return data.id;
}

async function findOrCreateLibrary(ownerId) {
  const { data: existing } = await supabase.from('libraries')
    .select('id,name').eq('owner_id', ownerId).eq('name', LIBRARY_NAME).maybeSingle();
  if (existing) { console.log(`ℹ️  Reutilizando librería existente "${LIBRARY_NAME}".`); return existing.id; }
  const { data, error } = await supabase.from('libraries')
    .insert({ name: LIBRARY_NAME, owner_id: ownerId }).select('id').single();
  if (error) fail('Creando librería: ' + error.message);
  console.log(`✅ Librería "${LIBRARY_NAME}" creada.`);
  return data.id;
}

function songToRow(s, libraryId) {
  return {
    library_id: libraryId,
    title: s.title || 'Sin título',
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
}

async function main() {
  console.log('Conectando a MongoDB…');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const Song = mongoose.model('Song', songSchema);
  const Setlist = mongoose.model('Setlist', setlistSchema);

  const ownerId = await getOwnerId();
  const libraryId = await findOrCreateLibrary(ownerId);

  // ── Canciones ──
  const songs = await Song.find().lean();
  console.log(`Encontradas ${songs.length} canciones en Mongo.`);
  const idMap = {}; // mongoId -> supabaseUuid
  let migrated = 0;
  for (const batch of chunk(songs, 200)) {
    const rows = batch.map((s) => songToRow(s, libraryId));
    const { data, error } = await supabase.from('songs').insert(rows).select('id');
    if (error) fail('Insertando canciones: ' + error.message);
    data.forEach((r, i) => { idMap[String(batch[i]._id)] = r.id; });
    migrated += data.length;
    console.log(`  … ${migrated}/${songs.length}`);
  }

  // ── Setlists ──
  const setlists = await Setlist.find().lean();
  console.log(`Encontrados ${setlists.length} setlists en Mongo.`);
  let setMigrated = 0;
  for (const sl of setlists) {
    const song_ids = (sl.songs || []).map((sid) => idMap[String(sid)]).filter(Boolean);
    const row = {
      library_id: libraryId,
      name: sl.name || 'Sin nombre',
      song_ids,
      meta: { description: sl.description || null, date: sl.date || null },
    };
    const { error } = await supabase.from('setlists').insert(row);
    if (error) { console.warn(`  ⚠️ setlist "${row.name}": ${error.message}`); continue; }
    setMigrated++;
  }

  console.log('\n──────────────────────────────────────────────');
  console.log(`✅ Migración completa: ${migrated} canciones, ${setMigrated} setlists.`);
  console.log(`\n👉 Pon esto en Vercel (Environment Variables de GI.Setlist):`);
  console.log(`   GISETLIST_LIBRARY_ID = ${libraryId}`);
  console.log('──────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => fail(e.message));
