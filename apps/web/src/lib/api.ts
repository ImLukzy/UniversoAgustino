import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { PEN, cancelLabel } from "@hub/shared";

export type * from "./apiTypes";

export const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
  "http://localhost:4000/api/v1";
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Sprint 4 (F4-02): access SOLO en memoria. Sin persistencia legible por JS:
// un XSS ya no puede exfiltrar un token persistente. La sesión se rehidrata
// en cada carga vía cookie httpOnly (POST /auth/refresh) gracias al
// interceptor. Tokens viejos en localStorage quedan huérfanos e inertes.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Para peticiones fuera de axios (pdf.js): el PDF de pago exige sesión (spec 15).
export function authHeaders(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

let refreshing: Promise<string> | null = null;

function refreshAccess(): Promise<string> {
  if (!refreshing) {
    refreshing = api
      .post("/auth/refresh")
      .then((r) => {
        const token = String(r.data?.data?.access ?? r.data?.accessToken ?? "");
        if (!token) throw new Error("Refresh sin access token");
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

function isAuthPath(url?: string): boolean {
  return !!url && (url.includes("/auth/refresh") || url.includes("/auth/login"));
}

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err: unknown) => {
    const axiosErr = err as AxiosError<{ error?: { message?: string; code?: string } }>;
    const original = (axiosErr?.config ?? undefined) as RetriableConfig | undefined;
    const status = axiosErr?.response?.status;
    // Sin token que rotar ni reintento posible: se propaga el error.
    if (!original || status !== 401 || original._retried || isAuthPath(original.url)) return Promise.reject(err);
    original._retried = true;
    try {
      const fresh = await refreshAccess();
      original.headers = { ...(original.headers as Record<string, string> | undefined), Authorization: `Bearer ${fresh}` };
      return await api(original);
    } catch (refreshErr) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(refreshErr);
    }
  },
);


export const pen = PEN;

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: { message?: string; code?: string } } | undefined;
    if (d?.error?.message) return d.error.message;
    if (e.message) return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Error inesperado";
}

/** Etiqueta de estado con motivo de cancelación; null si no aplica (usar mapa local). */
export function displayOrderStatus(order: { status: string; cancelledReason?: string | null }): string | null {
  return order.status === "CANCELLED" ? cancelLabel(order.cancelledReason) : null;
}

export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

// Sube imagen/PDF (QR, archivos) y devuelve URL absoluta lista para guardar.
// Con onProgress opcional (0-100) para barras de subida animadas.
export async function uploadFileWithProgress(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api.post("/uploads", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      const total = e.total ?? file.size ?? 0;
      if (total > 0) onProgress?.(Math.min(100, Math.round((e.loaded / total) * 100)));
    },
  });
  const url = String(r.data?.data?.url ?? "");
  if (!url) throw new Error("Subida sin URL");
  return resolveQr(url) ?? url;
}

export const uploadFile = (file: File) => uploadFileWithProgress(file);

// Normaliza una URL guardada (absoluta o /uploads/...) a URL visible.
export function resolveQr(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : API_ORIGIN + url;
}

// Páginas 1–2 del documento de pago (spec 15, T7): pública, sin la ruta del archivo.
export const previewUrl = (id: string) => `${API_BASE}/documents/${encodeURIComponent(id)}/preview`;
