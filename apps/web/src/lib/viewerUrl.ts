import { API_ORIGIN } from "./api";

// Solo archivos propios: /uploads/<uuid>.<ext>, reconstruidos sobre el origen
// de la API. Nunca se pide una URL externa guardada en BD (anti-XSS/SSRF).
const UPLOAD_PATH = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpe?g)$/i;

export function safeFileUrl(raw?: string | null, origin: string = API_ORIGIN): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw, origin);
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) return null;
  return UPLOAD_PATH.test(url.pathname) ? origin + url.pathname : null;
}

export const isPdfUrl = (url: string) => /\.pdf$/i.test(url);
