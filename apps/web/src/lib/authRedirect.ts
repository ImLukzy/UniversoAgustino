// Destino tras iniciar sesión. El login por correo ocurre en un modal sobre la
// página actual (no hay redirección); este registro cubre los saltos de página
// completos: /login?next=… y el ida y vuelta de OAuth (Google/Apple).
const KEY = "hub_return_to";

// Solo rutas internas relativas (evita open redirects) y nunca pantallas de auth.
export function safeReturnPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (/^\/(login|auth\/|register|forgot-password|reset-password|bienvenida)/.test(path)) return null;
  return path;
}

export function rememberReturnTo(path = window.location.pathname + window.location.search) {
  const safe = safeReturnPath(path);
  try {
    if (safe) sessionStorage.setItem(KEY, safe);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sin storage: se vuelve al inicio */
  }
}

export function takeReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return safeReturnPath(v);
  } catch {
    return null;
  }
}
