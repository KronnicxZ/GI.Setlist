import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// TODAS las vistas van lazy: cada audiencia descarga SOLO su app. Un cantante
// que abre cantantes.* no paga el código del gestor completo (y viceversa) —
// clave para que las vistas del equipo abran rápido en el móvil.
const App = lazy(() => import('./App'));
const PublicSetlist = lazy(() => import('./components/PublicSetlist'));
const SingersApp = lazy(() => import('./apps/SingersApp'));
const ProductionApp = lazy(() => import('./apps/ProductionApp'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#FBAE00]/30 border-t-[#FBAE00] rounded-full animate-spin" />
  </div>
);

// La raíz "/" elige la app según el SUBDOMINIO: así cantantes.* y letras.*
// abren directo su vista sin rutas que recordar. Las rutas /cantantes y
// /produccion funcionan además en cualquier dominio (útil para probar antes
// de configurar el DNS).
const host = window.location.hostname;
let HomeApp = App;
if (/^(cantantes|singers)\./i.test(host)) HomeApp = SingersApp;
else if (/^(letras|produccion|producción|production)\./i.test(host)) HomeApp = ProductionApp;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeApp />} />
            <Route path="/cantantes" element={<SingersApp />} />
            <Route path="/produccion" element={<ProductionApp />} />
            <Route
              path="/shared/:id"
              element={<PublicSetlist apiUrl={process.env.REACT_APP_API_URL || '/api'} />}
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registrado con éxito: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW fallo en registro: ', registrationError);
      });
  });
}
