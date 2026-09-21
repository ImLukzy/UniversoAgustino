import axios from "axios";

export const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
  "http://localhost:4000/api/v1";
export const API_ORIGIN = API_BASE.replace(/\/api\/v1$/, "");

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("hub_access");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // No borramos aquí para no romper flujos de login; el AuthContext decide.
    }
    return Promise.reject(err);
  }
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
// Universo Agustino: comunidad UNSA-only; university siempre "UNSA". career = clave de UNSA_CAREERS.
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
  itemTitle?: string;
  itemDesc?: string | null;
  itemTx?: string | null;
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

export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

// Sube imagen/PDF (QR, archivos) y devuelve URL absoluta lista para guardar.
export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
  const url = String(r.data?.data?.url ?? "");
  if (!url) throw new Error("Subida sin URL");
  return url.startsWith("http") ? url : API_ORIGIN + url;
}

// Normaliza QR guardado (absoluto o /uploads/...) a URL visible.
export function resolveQr(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : API_ORIGIN + url;
}
