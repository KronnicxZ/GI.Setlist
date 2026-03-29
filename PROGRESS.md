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

### 6. Asistente de IA de Contexto Avanzado (Global)
- **Botón Flotante Global:** Se integró un botón circular ultra-discreto y elegante en el layout principal (`App.js`) que ofrece acceso instantáneo al asistente desde cualquier pantalla.
- **Conciencia de Base de Datos:** El asistente ahora consulta la lista completa de canciones del usuario (Título, Artista, Tono, BPM) antes de responder, permitiendo recomendaciones personalizadas basadas en su propio repertorio.
- **Especialización Worship:** Configurado mediante un "System Prompt" robusto para actuar como experto en música Cristiana (Alabanza y Adoración).
- **Interfaz No Invasiva:** En escritorio, el chat se abre como un popup lateral que permite seguir visualizando el contenido de la biblioteca mientras se consulta la IA. En móviles, se adapta a pantalla completa para máxima legibilidad.

### 7. Optimización de Formato de Acordes y Visualización
- **Formato Clásico Pro:** Se re-entrenó el prompt de generación para abandonar el formato "inline" y forzar el estilo clásico profesional (Acordes en línea superior, letra en línea inferior), mejorando drásticamente la lectura para músicos.
- **Correcciones de Previsualización:** 
  - Se reparó el bug de "Video no disponible" en el modal de reproducción al mejorar el extractor de IDs de YouTube para soportar enlaces cortos (`youtu.be`).
  - Se eliminó el texto innecesario ("Estilo Chordify") de los botones para una UI más limpia.

### 8. Lógica de Setlists y Sincronización
- **Orden Personalizado Preservado:** Se eliminó el auto-ordenamiento alfabético en los setlists. Ahora las canciones se muestran exactamente en el orden en que el usuario las arrastró y guardó durante la creación del setlist.
- **Sincronización de Fechas (Timezone Fix):** Se solucionó el desfase de fechas (donde un Domingo se mostraba como Sábado) forzando la visualización en formato `UTC` para todos los calendarios de setlists.
- **Estado de Orden Inicial:** Se sincronizó el estado interno de la biblioteca para que inicie por defecto en "Recientes", coincidiendo con lo que indica la interfaz visual.

---

## ⏳ Pendiente por Desarrollar (Próximos Pasos)

- [ ] **Afinador Cromático:** Implementar la detección de pitch en tiempo real.
- [ ] **Tablatura Interactiva:** Explorar visualizadores de tablaturas para canciones seleccionadas.

---

## 📝 Notas del Desarrollador
- El sistema ha alcanzado un nivel de madurez profesional con la integración de la IA contextual.
- La estabilidad del formato de acordes y la coherencia en el orden de los setlists cierran los flujos críticos de uso en vivo.
- El repositorio se mantiene sincronizado en GitHub con commits detallados de cada mejora de UX.
