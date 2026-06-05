# 📌 Próxima sesión — GI.Setlist

Notas para retomar el trabajo de profesionalización. Última actualización: junio 2026.

---

## ✅ Estado actual

Se hizo una pasada de profesionalización en la rama **`chore/professional-pass`**
→ **PR [#1](https://github.com/KronnicxZ/GI.Setlist/pull/1)** (abierto, pendiente de
revisar/mergear). 6 commits, en 4 fases:

- **🔒 Seguridad** — auth real en endpoints de escritura/IA/backup/restore (token
  de admin `x-admin-token` derivado de `ADMIN_PASSWORD`); sin password
  hardcodeada; CORS restringido (`ALLOWED_ORIGINS`); `restore` no destructivo
  (upsert por id, preserva refs canción↔setlist).
- **🧹 Limpieza + docs** — sin cruft de Mongo; README/DEPLOYMENT a Supabase;
  `.env.example`; docs de proceso movidos a `docs/`.
- **💪 Robustez + UX** — `useData` chequea `response.ok` y muestra el error;
  Service Worker v5 no cachea `/api/`; errores de IA inline (no `alert()`).
- **🛠️ Tooling** — Prettier + CI (GitHub Actions) + build cross-platform
  (`cross-env`) + `.gitattributes` (LF).

---

## ⚠️ ANTES de mergear / deployar (crítico)

1. **Setear `ADMIN_PASSWORD` en Vercel** (Project → Settings → Environment
   Variables). Antes había un fallback hardcodeado; **sin esta env var el login
   falla cerrado** y nadie puede entrar como admin.
2. **Rotar esa contraseña** — la vieja (`H8e5n14r19y251`) quedó en el historial
   de git; usar una nueva fuerte.
3. Tras el deploy, **volver a iniciar sesión** (para obtener el nuevo token de
   admin; las sesiones viejas quedan sin token a propósito).
4. Si el dominio de producción no es `gi-setlist.vercel.app`, setear
   **`ALLOWED_ORIGINS`** (lista separada por comas).

Checklist completo de env vars: ver [.env.example](../.env.example) y
[DEPLOYMENT.md](../DEPLOYMENT.md).

---

## 🧪 Cómo probar local antes de mergear

```bash
cp .env.example .env   # completar Supabase + ADMIN_PASSWORD + IA
npm install
npm run dev            # frontend :3000 + backend :5000
```
Probar: login admin → crear/editar/borrar canción y setlist (deben funcionar con
sesión, fallar 401 sin ella) · backup/restore · generar acordes con IA · modo
visitante (solo lectura).

---

## 🚧 Pendiente

### 1. Migración CRA → Vite (lo más grande)
Create React App (`react-scripts`) está deprecado. Migrar a Vite mejora build y
DX. **Hacerlo en una sesión dedicada CON el dev server corriendo** (no a ciegas):
toca el deploy de producción. Pasos:

- [ ] `npm i -D vite @vitejs/plugin-react` (quitar `react-scripts`).
- [ ] Mover `public/index.html` → `index.html` en la raíz; quitar `%PUBLIC_URL%`,
      agregar `<script type="module" src="/src/index.js">`.
- [ ] `vite.config.js`: plugin react, `server.proxy['/api'] → http://localhost:5000`,
      `build.outDir: 'build'` (para no tocar `vercel.json`), `server.port: 3000`.
- [ ] Renombrar entradas JSX si hace falta (`.js` con JSX → Vite lo tolera con
      el plugin, pero conviene revisar).
- [ ] **Env vars**: `process.env.REACT_APP_API_URL` → `import.meta.env.VITE_API_URL`
      (o dejar el default `/api`, que es lo que se usa hoy — buscar todos los
      `process.env.REACT_APP_*`).
- [ ] Scripts: `start`/`dev` → `vite`, `build` → `vite build`.
- [ ] Verificar **PWA** (service worker en `public/` se sigue sirviendo en `/`),
      MUI, react-quill, Tone.js, y el registro del SW en `src/index.js`.
- [ ] Probar `npm run build` + el preview, y un **deploy de preview en Vercel**
      antes de mergear a main.

### 2. Pulidos menores (UX / a11y)
- [ ] `window.confirm` de "descartar cambios sin guardar" (`SongForm.js`) →
      usar el `ConfirmationModal` existente.
- [ ] Validación de formularios en el **server** (`db.js`: `createSong` acepta
      cualquier cosa; validar al menos `title`/`artist`; `SetlistForm` no impide
      guardar con 0 canciones).
- [ ] Accesibilidad: `aria-label` en botones de solo-ícono (cerrar `✕`, nav del
      calendario, menús) en SongForm/SetlistForm/LoginModal/AdminPanel; focus
      trap + cerrar con `Esc` en los modales.
- [ ] Feature de **duración de YouTube** muerta: el server pide solo
      `part=snippet` (no `contentDetails`), así que `getVideoDuration`/
      `formatDuration` (`utils/youtube.js`) nunca reciben datos. O completarla
      (pedir `contentDetails`) o eliminar el código muerto + el import en
      `SongForm.js`.
- [ ] Limpiar warnings de eslint del build (`no-useless-escape`, `no-unused-vars`)
      y considerar quitar `CI=false` una vez limpios.

### 3. Opcional
- [ ] Rate limiting en los endpoints de IA (cuestan dinero).
- [ ] Revisar el gesto oculto de login (5 clics en el logo) — documentar o mejorar.

---

## ℹ️ Contexto

- **Comparte la BD de Supabase con LivePads** (app de escritorio en
  `C:\Dev\Live-Pads`). Cualquier cambio en el esquema/datos afecta a ambas.
- Backend serverless en Vercel (`server/server.js` + `server/db.js`), deploy
  unificado con el frontend (`vercel.json`).
- Identidad git de este repo: `josemontilladev <proyectos@pencilspeech.com>`.
