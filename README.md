# 🎸 GI Setlist

**Sistema de gestión de setlists y biblioteca musical para iglesias**

Una Progressive Web App (PWA) moderna y elegante diseñada para ayudar a equipos de alabanza a organizar canciones, crear setlists y gestionar su biblioteca musical.

---

## ✨ Características

### 🎵 Gestión de Canciones
- **Biblioteca completa** con búsqueda y filtros avanzados
- **Información detallada**: título, artista, género, BPM, tono, letra con acordes
- **Integración con YouTube**: reproduce canciones directamente desde la app
- **Miniaturas de video**: visualiza las canciones con sus thumbnails de YouTube
- **Duplicación inteligente**: crea variaciones de canciones fácilmente

### 📋 Setlists Dinámicos
- **Crea y edita setlists** para servicios, ensayos o eventos
- **Drag & drop** para reordenar canciones
- **Duración total** calculada automáticamente
- **Vista de presentación** optimizada para proyección

### 👤 Sistema de Autenticación
- **Modo administrador** con control total
- **Modo visitante** para visualización sin edición
- **Panel de administración** con backup y restore de datos

### 📱 Progressive Web App (PWA)
- **Instalable** en móviles y desktop como app nativa
- **Funciona offline** (interfaz cacheada)
- **Actualizaciones automáticas**
- **Experiencia nativa** sin barra de navegador

### 💾 Backup & Restore
- **Exporta** toda tu biblioteca en formato JSON
- **Importa** copias de seguridad con un clic
- **Limpieza automática** de caché al restaurar

### 🎨 Diseño Premium
- **Interfaz moderna** con efectos glass y animaciones suaves
- **Modo oscuro** optimizado para uso en escenarios con poca luz
- **Responsive** - funciona perfecto en móvil, tablet y desktop
- **Accesibilidad** con navegación por teclado

---

## 🚀 Tecnologías

### Frontend
- **React** - Biblioteca de UI
- **Tailwind CSS** - Estilos modernos y responsivos
- **Service Worker** - Funcionalidad offline

### Backend
- **Node.js + Express** - API REST (funciones serverless en Vercel)
- **Supabase (PostgreSQL)** - Base de datos en la nube, **fuente única compartida con LivePads**
- **service_role key** - acceso solo-backend a Supabase (se salta RLS)

### Integraciones
- **YouTube API** - Datos de videos (título, canal) y player embebido
- **Groq / OpenRouter** - generación de acordes y chat asistente (IA)

---

## 📦 Instalación

### Prerrequisitos
- Node.js 16+ y npm
- Proyecto de Supabase (URL + service_role key) — el mismo que usa LivePads
- API Keys de Groq / OpenRouter (IA) y de YouTube (opcional)

### Pasos

1. **Clona el repositorio**
```bash
git clone <tu-repo-url>
cd GI-Setlist
```

2. **Instala dependencias**
```bash
npm install
```

3. **Configura variables de entorno**

Copiá `.env.example` a `.env` y completá los valores (Supabase, admin, IA, YouTube):
```bash
cp .env.example .env
```
Mínimo indispensable: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GISETLIST_LIBRARY_ID` y `ADMIN_PASSWORD`. Ver [.env.example](.env.example) para la lista completa.

4. **Inicia el proyecto**
```bash
npm run dev
```

Esto iniciará:
- Frontend en `http://localhost:3000`
- Backend en `http://localhost:5000`

---

## 📂 Estructura del Proyecto

```
GI-Setlist/
├── public/                 # Archivos públicos
│   ├── favicon.png        # Icono de la app
│   ├── index.html         # HTML principal
│   ├── manifest.json      # Configuración PWA
│   └── service-worker.js  # Service Worker para offline
├── server/                # Backend (Express, serverless en Vercel)
│   ├── db.js             # Capa de datos sobre Supabase (mapeo de campos)
│   └── server.js         # Servidor Express + endpoints (API, IA, YouTube, auth)
├── src/                   # Frontend
│   ├── components/       # Componentes React
│   │   ├── AdminPanel.js
│   │   ├── BibleVerse.js
│   │   ├── ConfirmationModal.js
│   │   ├── CustomAlert.js
│   │   ├── DuplicateModal.js
│   │   ├── LoginModal.js
│   │   ├── PlayerModal.js
│   │   ├── SearchBar.js
│   │   ├── SetlistForm.js
│   │   ├── SongForm.js
│   │   ├── SongList.js
│   │   └── SortFilter.js
│   ├── constants/        # Constantes de la app
│   ├── context/          # Context API (Auth)
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilidades
│   ├── App.js            # Componente principal
│   ├── index.css         # Estilos globales
│   └── index.js          # Punto de entrada
├── .env                   # Variables de entorno (no incluir en git)
├── .gitignore            # Archivos ignorados por git
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

---

## 🎯 Scripts Disponibles

```bash
# Desarrollo (frontend + backend)
npm run dev

# Solo frontend
npm start

# Solo backend
npm run server

# Build para producción
npm run build
```

---

## 🌐 Despliegue

### Frontend (Vercel/Netlify)
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Build command: `npm run build`
4. Output directory: `build`

### Backend (Render/Railway/Heroku)
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Start command: `node server/server.js`

---

## 🔐 Seguridad

- **Variables de entorno** para credenciales sensibles
- **CORS** configurado para dominios específicos
- **Validación** de datos en backend
- **HTTPS** requerido en producción (para PWA)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad de alabanza

---

## 🙏 Agradecimientos

- **Elevation Worship** y otros artistas por la inspiración musical
- **Supabase** por la base de datos en la nube
- **YouTube** por la API de videos
- **Vercel** por el hosting gratuito

---

## 📞 Soporte

Si encuentras algún bug o tienes una sugerencia, por favor abre un issue en GitHub.

---

**¡Que Dios bendiga tu ministerio de alabanza! 🎵✨**
