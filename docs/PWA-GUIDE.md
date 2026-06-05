# 📱 Guía de PWA - GI Setlist

## ¿Qué es una PWA?

Tu aplicación ahora es una **Progressive Web App (PWA)**, lo que significa que los usuarios pueden instalarla en sus dispositivos móviles directamente desde el navegador, sin necesidad de Google Play Store o App Store.

## ✨ Características PWA Activadas

✅ **Instalable** - Los usuarios pueden agregar la app a su pantalla de inicio  
✅ **Funciona Offline** - La app funciona sin conexión a internet (caché inteligente)  
✅ **Icono en Pantalla de Inicio** - Se ve como una app nativa  
✅ **Sin Barra de Navegador** - Experiencia de pantalla completa  
✅ **Actualizaciones Automáticas** - Se actualiza cuando actualizas tu web  
✅ **Compatible iOS y Android** - Funciona en ambos sistemas operativos  

---

## 📲 Cómo Instalar en Android

### Opción 1: Chrome (Recomendado)
1. Abre tu app en **Chrome** en tu Android
2. Busca el banner que dice "Agregar a pantalla de inicio" (aparece automáticamente)
3. O toca el menú (⋮) → **"Agregar a pantalla de inicio"** o **"Instalar app"**
4. Confirma la instalación
5. ¡Listo! El icono aparecerá en tu pantalla de inicio

### Opción 2: Samsung Internet
1. Abre tu app en **Samsung Internet**
2. Toca el menú (☰) → **"Agregar página a"** → **"Pantalla de inicio"**
3. Confirma
4. ¡Instalado!

---

## 📲 Cómo Instalar en iOS (iPhone/iPad)

1. Abre tu app en **Safari** (debe ser Safari, no Chrome)
2. Toca el botón de **Compartir** (□↑) en la parte inferior
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Edita el nombre si quieres
5. Toca **"Agregar"**
6. ¡Listo! El icono aparecerá en tu pantalla de inicio

> **Nota:** En iOS, las PWAs solo funcionan desde Safari, no desde Chrome u otros navegadores.

---

## 💻 Cómo Instalar en Escritorio

### Chrome/Edge (Windows, Mac, Linux)
1. Abre tu app en Chrome o Edge
2. Busca el icono de instalación (⊕) en la barra de direcciones
3. O ve al menú (⋮) → **"Instalar GI Setlist"**
4. Confirma la instalación
5. La app se abrirá en su propia ventana

---

## 🔧 Archivos PWA en tu Proyecto

```
public/
├── manifest.json          ← Configuración de la PWA
├── service-worker.js      ← Maneja el caché y funcionalidad offline
├── index.html             ← Incluye meta tags PWA
└── favicon.png            ← Icono de la app
```

---

## 🚀 Cómo Probar la PWA Localmente

1. **Inicia tu servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre en Chrome:** `http://localhost:3000`

3. **Abre DevTools:** F12 → Pestaña **"Application"**

4. **Verifica:**
   - **Manifest:** Debe mostrar toda la info de tu app
   - **Service Workers:** Debe estar registrado y activo
   - **Lighthouse:** Ejecuta un audit PWA (debe dar 90+ puntos)

---

## 📊 Verificar que tu PWA está Funcionando

### Checklist:
- [ ] El Service Worker está registrado (ver consola)
- [ ] El manifest.json se carga sin errores
- [ ] Aparece el banner de instalación en móvil
- [ ] Los iconos se ven correctamente
- [ ] La app funciona offline (desconecta internet y prueba)

### Comando para verificar en DevTools:
```javascript
// Pega esto en la consola del navegador
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers registrados:', regs.length);
  regs.forEach(reg => console.log(reg));
});
```

---

## 🎨 Personalización Futura

Si quieres personalizar más tu PWA, puedes editar:

### `public/manifest.json`
```json
{
  "theme_color": "#tu-color",        // Color de la barra de estado
  "background_color": "#tu-color",   // Color de splash screen
  "orientation": "portrait-primary"  // Orientación de la app
}
```

### Agregar Iconos de Mejor Calidad
Actualmente usas `favicon.png` para todos los tamaños. Para mejor calidad:
1. Crea iconos de 192x192 y 512x512 píxeles
2. Nómbralos `icon-192.png` y `icon-512.png`
3. Actualiza el `manifest.json` para usarlos

---

## 🔄 Actualizar la PWA

Cuando hagas cambios en tu código:

1. **Incrementa la versión del caché** en `public/service-worker.js`:
   ```javascript
   const CACHE_NAME = 'gi-setlist-v4-pwa'; // Cambia el número
   ```

2. Los usuarios obtendrán la actualización automáticamente la próxima vez que abran la app

---

## 🌐 Desplegar en Producción

Tu PWA ya está lista para producción. Cuando hagas deploy a Vercel:

1. **Build de producción:**
   ```bash
   npm run build
   ```

2. **Deploy a Vercel:**
   ```bash
   vercel --prod
   ```

3. Los usuarios podrán instalar desde tu URL de producción

---

## ❓ Preguntas Frecuentes

### ¿Necesito publicar en Google Play Store?
**No.** Los usuarios instalan directamente desde el navegador.

### ¿Funciona sin internet?
**Sí.** El Service Worker cachea los recursos principales. Pero funciones que requieren el servidor (como guardar setlists) necesitarán conexión.

### ¿Se actualiza automáticamente?
**Sí.** Cuando actualizas tu web, la PWA se actualiza automáticamente.

### ¿Puedo convertirla a APK después?
**Sí.** Puedes usar herramientas como:
- **PWA Builder** (https://www.pwabuilder.com/)
- **Capacitor** (para apps nativas)
- **Bubblewrap** (CLI de Google para generar APK)

### ¿Funciona en iOS?
**Sí.** Pero con algunas limitaciones:
- Solo se instala desde Safari
- Algunas funciones avanzadas no están disponibles
- Pero la funcionalidad básica funciona perfectamente

---

## 🎉 ¡Tu App Ya es una PWA!

No se rompió nada de tu código existente. Solo agregamos:
- Meta tags PWA en el HTML
- Mejoras al manifest.json
- Actualización del Service Worker

**Todo sigue funcionando exactamente igual, pero ahora es instalable en móviles.** 🚀
