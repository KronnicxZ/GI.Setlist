import React from 'react';

// Accesos rápidos a las vistas del equipo (Cantantes / Producción). Abren en
// una pestaña nueva para no perder lo que el gestor tenga abierto. Mientras no
// haya subdominios, apuntan a las rutas /cantantes y /produccion del mismo host.
const LINKS = [
  {
    href: '/cantantes',
    label: 'Cantantes',
    sub: 'Letras y tono',
    // Micrófono
    icon: 'M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z',
  },
  {
    href: '/produccion',
    label: 'Producción',
    sub: 'Letras para Holyrics',
    // Monitor/proyección
    icon: 'M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z',
  },
];

// Variante barra lateral (desktop): fila con icono + textos; en modo colapsado,
// solo el icono centrado.
export function TeamLinksSidebar({ collapsed }) {
  return (
    <div className="space-y-1">
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? l.label : ''}
          className={`flex items-center ${collapsed ? 'justify-center py-2' : 'space-x-3 px-4 py-3 rounded-sub hover:bg-white/[0.03]'} text-gray-400 hover:text-primary w-full transition-all group`}
        >
          <div
            className={`${collapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 transition-colors`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d={l.icon} />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium leading-tight">{l.label}</span>
              <span className="text-[10px] text-gray-500 tracking-wide">{l.sub}</span>
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

// Variante píldoras (móvil): dos botones en una fila, siempre a la mano.
export function TeamLinksPills() {
  return (
    <div className="flex items-center gap-2">
      {LINKS.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[11px] font-bold active:bg-white/10 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24">
            <path fill="currentColor" d={l.icon} />
          </svg>
          {l.label}
        </a>
      ))}
    </div>
  );
}
