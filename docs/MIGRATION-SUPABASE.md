# Migración de GI.Setlist a Supabase (fuente única con LivePads)

GI.Setlist deja de usar MongoDB y pasa a leer/escribir la **misma tabla `songs`/`setlists`** de Supabase que usa LivePads. Todas sus canciones viven en una **librería maestra** dedicada.

## Resumen de cambios (rama `supabase-migration`)
- `server/db.js` (nuevo): capa de datos sobre Supabase (service_role) con el mapeo de campos.
- `server/server.js`: reescrito para usar `db.js` en vez de Mongoose. La API (`/api/songs`, `/api/setlists`, backup, IA, YouTube, auth) **no cambia** de forma — el frontend sigue igual.
- `migrate-to-supabase.js` (nuevo): script único Mongo → Supabase (crea la librería y migra todo).
- `@supabase/supabase-js` añadido a dependencias.

El frontend NO se tocó: se mapea `id` → `_id` y se aplanan los campos extra.

---

## Pasos

### 1) Aplicar la migración 0005 en Supabase (una vez)
En LivePads ya está `supabase/migrations/0005_song_extra_fields.sql`. Pégala en **Supabase → SQL Editor → Run** (añade `youtube_url, notes, original_key, vocalist_key, duration` a `songs`). Si LivePads ya la corrió, salta este paso.

### 2) Migrar los datos (local, una vez)
En la carpeta de GI.Setlist:
```bash
npm install
```
Crea un archivo `.env` temporal (NO lo subas) con:
```
MONGODB_URI=...tu cadena actual de Mongo Atlas...
SUPABASE_URL=https://hmrviyzisgoovyttnsth.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...service_role de Supabase (Settings → API)...
OWNER_EMAIL=montillajose221@gmail.com
```
Ejecuta:
```bash
node migrate-to-supabase.js
```
Al final imprime el **`GISETLIST_LIBRARY_ID`** — cópialo.

### 3) Variables de entorno en Vercel (proyecto GI.Setlist)
Settings → Environment Variables:
- **Añade**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GISETLIST_LIBRARY_ID` (el del paso 2).
- **Quita** (o deja sin usar): `MONGODB_URI`.
- Mantén las demás (`YOUTUBE_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ADMIN_PASSWORD`).

⚠️ La `SUPABASE_SERVICE_ROLE_KEY` es secreta y todopoderosa: solo va en Vercel (servidor), nunca en el frontend ni en el repo.

### 4) Desplegar
Haz merge de la rama `supabase-migration` a tu rama principal (o despliega la rama) en Vercel. Verifica:
- `https://gi-setlist.vercel.app/` carga las canciones (ahora desde Supabase).
- Crear/editar/borrar una canción funciona.
- Los setlists cargan con sus canciones.

### 5) LivePads
En LivePads, únete a la librería **"Repertorio GI.Setlist"** (o ya eres el dueño) → **⬇ Bajar canciones** → verás todo el repertorio. Fuente única lograda.

---

## Notas
- **Mongo** queda sin usar; cuando confirmes que todo va bien, puedes pausar/borrar el cluster. La carpeta `server/models/` y la dependencia `mongoose` solo las usa el script de migración.
- El orden de canciones en un setlist se preserva (`song_ids` es un array ordenado).
- Si re-ejecutas el script de migración, reutiliza la misma librería (no duplica la librería), pero **insertaría las canciones otra vez** — córrelo una sola vez, o vacía la tabla antes.
