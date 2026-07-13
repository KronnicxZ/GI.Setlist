// Toast mínimo sin dependencias: reemplaza los alert() nativos (que rompen la
// estética y bloquean el hilo) por un aviso oscuro auto-descartable, coherente
// con el tema. Uso: showToast('Letra copiada'); tipos: 'info' | 'error'.
let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.style.cssText =
    'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'info') {
  const box = ensureContainer();
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'pointer-events:auto;max-width:88vw;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;' +
    'background:rgba(20,20,20,0.96);color:#fff;border:1px solid ' +
    (type === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(251,174,0,0.35)') +
    ';box-shadow:0 8px 30px rgba(0,0,0,0.5);opacity:0;transition:opacity .18s ease, transform .18s ease;transform:translateY(6px);';
  box.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => el.remove(), 220);
  }, 2600);
}
