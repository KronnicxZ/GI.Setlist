# 🚀 Guía de Despliegue — GI Setlist

GI.Setlist se despliega **unificado en Vercel**: el frontend (build de React) y el
backend (Express como funciones serverless) viven en el mismo proyecto, según
`vercel.json`. La base de datos es **Supabase** (la misma que usa LivePads).

---

## 📋 Pre-requisitos

- ✅ Proyecto de **Supabase** (URL + `service_role` key) — el mismo de LivePads
- ✅ Id de la librería maestra de GI.Setlist (`GISETLIST_LIBRARY_ID`)
- ✅ API Keys de **Groq** y **OpenRouter** (IA) y de **YouTube** (opcional)
- ✅ Repositorio en GitHub conectado a **Vercel**

---

## 🌐 Despliegue en Vercel (unificado)

El `vercel.json` ya está configurado: build de React a `build/`, el server a
funciones serverless, y el ruteo `/api/* → server/server.js`, resto → SPA.

1. **Conectá el repo** en [vercel.com](https://vercel.com) → New Project → import.
2. **Framework Preset:** Create React App · **Build:** `npm run build` · **Output:** `build`.
3. **Variables de entorno** (Project Settings → Environment Variables) — ver
   [.env.example](.env.example) para la lista completa:

   | Variable | Obligatoria | Para qué |
   |---|---|---|
   | `SUPABASE_URL` | ✅ | URL del proyecto Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | acceso backend (se salta RLS) — **secreta** |
   | `GISETLIST_LIBRARY_ID` | ✅ | librería maestra en Supabase |
   | `ADMIN_PASSWORD` | ✅ | modo admin (sin ella el login queda deshabilitado) |
   | `GROQ_API_KEY` | ⬜ | generación de acordes + chat IA |
   | `OPENROUTER_API_KEY` | ⬜ | fallback de IA |
   | `YOUTUBE_API_KEY` | ⬜ | datos de videos de YouTube |

4. **Deploy.** Quedará todo en una sola URL (`https://<proyecto>.vercel.app`).

> ⚠️ **Importante:** `ADMIN_PASSWORD` debe estar seteada en Vercel. El backend
> **falla cerrado** (no acepta logins) si no está, así que sin ella nadie puede
> entrar en modo admin.

---

## 💻 Desarrollo local

```bash
cp .env.example .env   # completá los valores
npm install
npm run dev            # frontend :3000 + backend :5000 (proxy /api → :5000)
```

El `proxy` de `package.json` (`http://localhost:5000`) hace que el frontend en
`:3000` llame a `/api/*` y se redirija al server local.

---

## 🔒 Seguridad en producción

- **`service_role`**: solo en el backend (env vars de Vercel). Nunca en el cliente.
- **CORS**: restringido a los orígenes de producción en `server/server.js`.
- **Auth**: los endpoints de escritura exigen el token de admin (header
  `x-admin-token`) que el frontend obtiene al iniciar sesión.
- **HTTPS**: requerido (Vercel lo provee) — necesario para la PWA.

---

## ✅ Checklist de despliegue

- [ ] `.env` está en `.gitignore` (no subir credenciales) — ya configurado
- [ ] Variables de entorno cargadas en Vercel (incluida `ADMIN_PASSWORD`)
- [ ] Supabase accesible y `GISETLIST_LIBRARY_ID` correcto
- [ ] CORS apunta al dominio de producción
- [ ] `npm run build` funciona localmente
- [ ] Service Worker y `manifest.json` correctos (probar en localhost primero)

---

## 🐛 Troubleshooting

**No puedo entrar en modo admin** → verificá que `ADMIN_PASSWORD` esté seteada en
Vercel (sin ella el login falla cerrado).

**Error de CORS** → agregá el origen del frontend a la lista de orígenes
permitidos en `server/server.js`.

**"No data" / canciones vacías** → revisá `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` y `GISETLIST_LIBRARY_ID`.

**El Service Worker no se actualiza** → DevTools → Application → Service Workers →
Unregister, y subí la versión del cache en `public/service-worker.js`.

---

## 🔄 Actualizaciones

Push a la rama de producción → Vercel redespliega automáticamente (frontend +
funciones serverless).
