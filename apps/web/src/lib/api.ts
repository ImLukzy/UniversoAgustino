import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1",
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
// Comunidad UNSA-only: university siempre "UNSA". career = clave de UNSA_CAREERS.
export interface HubUser {
  id: string;
  email: string;
  role: string;
  profile?: { fullName: string; university: string; career?: string | null; cycle?: string | null } | null;
}

export interface HubDocument {
  id: string;
  title: string;
  course: string;
  university: string;
  career?: string | null;
  cycle: string;
  type: string;
  priceCents: number;
  description?: string | null;
  status: string;
  author?: { profile?: { fullName: string } | null } | null;
}

export interface HubBazarItem {
  id: string;
  title: string;
  kind: string;
  tx: string;
  priceCents: number;
  depositCents?: number | null;
  description?: string | null;
  status: string;
}

export interface HubOrder {
  id: string;
  itemType: string;
  itemId: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: string;
}
