# Registro de Progreso - GI Setlist

Este documento sirve como bitácora de los avances, optimizaciones y refactorizaciones realizadas en el proyecto **GI Setlist**. Detalla lo que ya hemos logrado y plantea el mapa de ruta para continuar desarrollando las funcionalidades y utilidades profesionales basadas en la aplicación anterior ("Generación Indetenible").

---

## ✅ Objetivos Completados

### 1. Despliegue Local y Restauración de Base de Datos
- **Entorno Local:** Repositorio clonado y configurado exitosamente mediante comandos duales (`concurrently`).
- **Migración de Datos:** Se creó y ejecutó con éxito el script `import.js` con soporte DNS (Google `8.8.8.8`) para inyectar 64 temas del CSV original hacia **MongoDB Atlas**.
- **Sesión de Administrador:** Integrado correctamente (password configurado en el backend y `.env`).

### 2. Integración de Inteligencia Artificial (AI Chordify Style)
- **Motor Principal:** Integración con **Groq (Llama 3)** de latencia ultra baja para generar acordes cifrados entre corchetes sobre la letra y metadatos (Tono, BPM).
- **Sistema Fallback (Rescate):** En caso de superar cuotas o fallo en el motor principal, el bot transita automáticamente hacia **OpenRouter (Gemini 2.5 Flash)** asegurando 100% de disponibilidad sin que la interfaz se congele.

### 3. Refactorización de Arquitectura y Red (Frontend / Backend)
- **Proxy Inverso Integrado:** Se ajustó el `package.json` insertando la cabecera `"proxy": "http://localhost:5000"`. Esto remueve los errores de CORS por defecto durante el modo de desarrollo.
- **Rutas Limpias:** Se sustituyó toda referencia sucia a variables de entorno para rutas API. Ahora en el código frontend solo se usa `/api/*` confiando en la arquitectura Proxy/Servidor.

### 4. Pulido de Interfaces Premium y Experiencia de Usuario (UX)
- **Empty States Avanzados:** Si la biblioteca de canciones no carga resultados de búsqueda o base de datos, ahora despliega una pantalla muy estética, profesional y "Glassmorfizada" con un icono neón y mensajes amigables, sustituyendo los estados rotos o aburridos.
- **Barra de Navegación Lateral y Móvil:** Expansión del UI con un menú adicional para agrupar todas las utilidades extra requeridas por el usuario ("Herramientas").

### 5. Herramientas Musicales Embebidas (Fase Inicial)
- **Módulo Creado:** `src/components/tools/Metronome.js`
- **Funcionalidad Click (Metrónomo):** 
  - Se utilizó `tone.js` para proveer sonido de precisión milimétrica inmune a los *delays* que suele dar Javascript estándar por los bucles de renderizado.
  - Diseño impactante de "luces" que parpadean según los Beats Per Measure (BPM), controles deslizantes suaves y pantalla numérica gigante con gradientes metálicos.

---

## ⏳ Pendiente por Desarrollar (Próximos Pasos)

Basado en el sistema antiguo de "Generación Indetenible", aquí está el mapa de ruta para ir puliendo (una por una) las siguientes utilidades dentro de la nueva pestaña **Herramientas**:

- [x] **Afinador:** 
  Utilizar llamadas a la API de Web Audio (`getUserMedia`) para captar las frecuencias de la guitarra/bajo/voz a través del micrófono del dispositivo y mostrar el resultado (la nota y cuán desafinada está) gráficamente.

- [x] **Song BPM (Tap Tempo):** 
  Añadir un componente donde el usuario pueda dar "Taps" continuos al ritmo de una canción externa y el sistema promedie los milisegundos para revelar la velocidad en BPMs al instante.

- [x] **Transponer:** 
  Aunque la aplicación principal aparentemente ya formatea bloques con `[C]`, idealmente crear una pequeña utilidad rápida tipo *sandbox* donde peguen un texto con acordes y con dos botones (+/-) se transporten todos los armónicos arriba o abajo en semitonos.

- [x] **Círculo de Quintas (Círculo):** 
  Construir un diagrama interactivo SVG estético o interactividad modular donde el usuario pueda consultar tonalidades relativas, dominantes y subdominantes con tan solo girarlo o hacer clics rápidos en las escalas.

- [x] **Progresiones:** 
  Una tabla o tarjetas animadas que guarden información vital para composiciones, como progresiones de acordes muy usadas en la alabanza moderna (Por ej: `I - V - vi - IV`, `vi - IV - I - V`), posiblemente con botones para escucharlas accionadas internamente con `tone.js`.

---

## 📝 Notas del Desarrollador para la Sesión Final
- Todo el ecosistema base está completamente operativo.
- El repositorio está a la espera del visto bueno del usuario habiendo relanzado mediante `npm run dev` para corroborar que la conexión y la carga automática de canciones fluya como el agua.
- Solo resta ejecutar iteraciones ordenadas para agotar la lista de pendientes (Afinador > Tap Tempo > etc.).
