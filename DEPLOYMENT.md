# 🚀 Guía de Despliegue - GI Setlist

Esta guía te ayudará a desplegar tu aplicación en producción.

---

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:

- ✅ Cuenta de MongoDB Atlas configurada
- ✅ API Key de YouTube (opcional)
- ✅ Repositorio Git (GitHub, GitLab, etc.)
- ✅ Cuenta en Vercel o Netlify (frontend)
- ✅ Cuenta en Render, Railway o Heroku (backend)

---

## 🌐 Opción 1: Despliegue Separado (Recomendado)

### Frontend en Vercel

1. **Conecta tu repositorio**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub

2. **Configura el proyecto**
   ```
   Framework Preset: Create React App
   Root Directory: ./
   Build Command: npm run build
   Output Directory: build
   ```

3. **Variables de entorno**
   ```
   REACT_APP_API_URL=https://tu-backend.onrender.com
   ```

4. **Despliega**
   - Haz clic en "Deploy"
   - Espera a que termine el build
   - Tu frontend estará en `https://tu-proyecto.vercel.app`

### Backend en Render

1. **Crea un nuevo Web Service**
   - Ve a [render.com](https://render.com)
   - Haz clic en "New +" → "Web Service"
   - Conecta tu repositorio

2. **Configura el servicio**
   ```
   Name: gi-setlist-api
   Environment: Node
   Build Command: npm install
   Start Command: node server/server.js
   ```

3. **Variables de entorno**
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gi-setlist
   YOUTUBE_API_KEY=tu_api_key_de_youtube
   PORT=5000
   NODE_ENV=production
   ```

4. **Despliega**
   - Haz clic en "Create Web Service"
   - Espera a que termine el despliegue
   - Tu backend estará en `https://tu-proyecto.onrender.com`

5. **Actualiza el frontend**
   - Ve a Vercel
   - Actualiza la variable `REACT_APP_API_URL` con la URL de Render
   - Redespliega

---

## 🔧 Opción 2: Despliegue Unificado en Vercel

Si quieres desplegar todo en Vercel:

1. **Configura vercel.json** (ya está incluido)
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": { "distDir": "build" }
       },
       {
         "src": "server/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/server/server.js" },
       { "src": "/(.*)", "dest": "/build/$1" }
     ]
   }
   ```

2. **Variables de entorno en Vercel**
   ```
   MONGODB_URI=tu_mongodb_uri
   YOUTUBE_API_KEY=tu_youtube_api_key
   ```

3. **Despliega**
   - Conecta tu repo en Vercel
   - Vercel detectará automáticamente la configuración
   - Todo estará en una sola URL

---

## 🗄️ Configuración de MongoDB Atlas

1. **Crea un cluster**
   - Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Crea un cluster gratuito (M0)

2. **Configura acceso**
   - Database Access → Add New Database User
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

3. **Obtén la connection string**
   - Clusters → Connect → Connect your application
   - Copia la URI: `mongodb+srv://usuario:password@cluster.mongodb.net/gi-setlist`

4. **Actualiza .env**
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gi-setlist
   ```

---

## 🔑 API Key de YouTube (Opcional)

Para obtener duraciones de videos automáticamente:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita "YouTube Data API v3"
4. Credentials → Create Credentials → API Key
5. Copia la API Key y agrégala a tus variables de entorno

---

## ✅ Checklist de Despliegue

Antes de desplegar, verifica:

- [ ] `.env` está en `.gitignore` (no subir credenciales)
- [ ] MongoDB Atlas está configurado y accesible
- [ ] Variables de entorno están configuradas en el servicio de hosting
- [ ] CORS está configurado correctamente en el backend
- [ ] Service Worker está funcionando (prueba en localhost primero)
- [ ] Manifest.json tiene la información correcta
- [ ] Favicon.png existe en /public
- [ ] Build de producción funciona localmente (`npm run build`)

---

## 🔒 Seguridad en Producción

1. **CORS**: Actualiza en `server/server.js`
   ```javascript
   const allowedOrigins = [
     'https://tu-frontend.vercel.app',
     'https://tu-dominio-custom.com'
   ];
   ```

2. **Variables de entorno**: Nunca expongas credenciales en el código

3. **HTTPS**: Asegúrate de que tanto frontend como backend usen HTTPS

4. **Rate Limiting**: Considera añadir rate limiting al backend

---

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
- Verifica que la IP esté permitida en MongoDB Atlas
- Verifica que la connection string sea correcta
- Verifica que el usuario tenga permisos

### Error: "CORS policy"
- Verifica que el origen del frontend esté en `allowedOrigins`
- Verifica que el backend esté corriendo

### Service Worker no se actualiza
- Limpia el caché del navegador
- Desregistra el SW en DevTools → Application → Service Workers
- Incrementa la versión en `service-worker.js`

### PWA no se puede instalar
- Verifica que tengas HTTPS (requerido en producción)
- Verifica que `manifest.json` esté correctamente configurado
- Verifica que el Service Worker esté registrado

---

## 📊 Monitoreo

Después del despliegue:

1. **Vercel/Render Dashboard**: Monitorea logs y errores
2. **MongoDB Atlas**: Monitorea uso de base de datos
3. **Google Analytics** (opcional): Añade tracking de usuarios

---

## 🔄 Actualizaciones

Para actualizar la app en producción:

1. Haz cambios en tu código local
2. Commit y push a GitHub
3. Vercel/Render detectarán el cambio y redesplegarán automáticamente

---

## 🎉 ¡Listo!

Tu app debería estar funcionando en:
- Frontend: `https://tu-proyecto.vercel.app`
- Backend: `https://tu-proyecto.onrender.com`

**¡Comparte la URL con tu equipo de alabanza! 🎸✨**
