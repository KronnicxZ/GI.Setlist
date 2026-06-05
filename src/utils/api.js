// Helpers de API. El token de admin se obtiene al iniciar sesión y se envía en
// el header `x-admin-token` en TODAS las peticiones de escritura / admin (el
// backend las rechaza sin él). Sin token, las peticiones de solo-lectura
// (listar canciones/setlists) siguen funcionando para visitantes.

export function getAdminToken() {
  try {
    return localStorage.getItem('adminToken') || '';
  } catch {
    return '';
  }
}

// Headers para peticiones JSON de escritura, con el token de admin si existe.
export function authHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-admin-token': token } : {}),
    ...extra,
  };
}

// Headers solo con el token (para DELETE/GET admin sin cuerpo JSON).
export function adminAuthHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    ...(token ? { 'x-admin-token': token } : {}),
    ...extra,
  };
}
