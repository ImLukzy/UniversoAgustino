import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

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

export function getAccessToken(): string | null {
  return accessToken;
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
    if (!original || status !== 401 || original._retried || isAuthPath(original.url)) {
      if (status === 401) {
        // Sin token que rotar ni reintento posible.
      }
      return Promise.reject(err);
    }
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

export const pen = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export function apiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: { message?: string; code?: string } } | undefined;
    if (d?.error?.message) return d.error.message;
    if (e.message) return e.message;
  }
  if (e instanceof Error) return e.message;
  return "Error inesperado";
}

// Tipos mínimos espejo del backend (evita importar @hub/shared en runtime web)
// Comunidad UNSA-only: university siempre "UNSA". career = clave de UNSA_CAREERS.
export interface HubUser {
  id: string;
  email: string;
  role: string;
  profile?: { fullName: string; university: string; career?: string | null; cycle?: string | null } | null;
}

export type PayMethod = "YAPE" | "PLIN" | "AMBAS";

export interface HubDocument {
  id: string;
  createdAt?: string;
  title: string;
  course: string;
  university: string;
  career?: string | null;
  cycle: string;
  type: string;
  priceCents: number;
  description?: string | null;
  fileUrl?: string | null;
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
  author?: { profile?: { fullName: string } | null } | null;
}

export interface HubBazarItem {
  id: string;
  createdAt?: string;
  title: string;
  kind: string;
  tx: string;
  priceCents: number;
  depositCents?: number | null;
  description?: string | null;
  photos?: string[] | null;
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
}

export interface HubOrder {
  id: string;
  buyerId: string;
  sellerId?: string | null;
  createdAt: string;
  itemType: string;
  itemId: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
  payProof?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  itemTitle?: string;
  itemDesc?: string | null;
  itemTx?: string | null;
  itemPriceCents?: number | null;
  feeBps?: number | null;
  fileUrl?: string | null;
  buyerCompleted?: number;
  buyer?: { id: string; email: string; profile?: { fullName: string; career?: string | null; cycle?: string | null } | null } | null;
}

export interface HubReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface HubNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

// Motivos de cancelación (espejo de CANCEL_REASON_LABEL en @hub/shared).
const CANCEL_LABELS: Record<string, string> = {
  TTL_EXPIRED: "Reserva expirada",
  TTL_BACKFILL: "Reserva expirada",
  BUYER_CANCELLED: "Cancelado por el comprador",
  SELLER_REJECTED: "Rechazado por el vendedor",
  ORPHAN_ITEM: "Publicación no disponible",
};

/** Etiqueta de estado con motivo de cancelación; null si no aplica (usar mapa local). */
export function displayOrderStatus(order: { status: string; cancelledReason?: string | null }): string | null {
  if (order.status === "CANCELLED" && order.cancelledReason) {
    return CANCEL_LABELS[order.cancelledReason] ?? null;
  }
  return null;
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
  return url.startsWith("http") ? url : API_ORIGIN + url;
}

export async function uploadFile(file: File): Promise<string> {
  return uploadFileWithProgress(file);
}

// Normaliza QR guardado (absoluto o /uploads/...) a URL visible.
export function resolveQr(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : API_ORIGIN + url;
}
