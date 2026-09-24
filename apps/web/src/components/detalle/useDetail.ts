import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PLATFORM_FEE_PCT, computePrice } from "@hub/shared";
import { api, apiError, resolveQr, type HubBazarItem, type HubDocument } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../AuthModalHost";
import { ROUTES } from "../../lib/routes";

interface Person {
  fullName: string;
  career?: string | null;
  cycle?: string | null;
}
type Doc = HubDocument & { author?: { profile?: Person | null } | null; fileType?: "pdf" | "image" | null };
type Item = HubBazarItem & { seller?: { profile?: Person | null } | null };

// Fecha local YYYY-MM-DD (evita el desfase UTC de toISOString).
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rentalError(start: string, end: string): string {
  if (!start || !end) return "Elige las fechas de inicio y fin del alquiler.";
  if (start < todayLocal()) return "La fecha de inicio no puede ser anterior a hoy.";
  if (end <= start) return "La fecha de fin debe ser posterior a la de inicio.";
  return "";
}

// Detalle de un apunte o artículo + creación del pedido (reserva) → checkout.
export function useDetail(kind: "document" | "bazar", id: string | undefined) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [rental, setRental] = useState({ start: "", end: "" });
  const doc = useQuery({ queryKey: ["detail-doc", id], enabled: kind === "document" && !!id, queryFn: async () => (await api.get(`/documents/${id}`)).data.data as Doc });
  const item = useQuery({ queryKey: ["detail-bazar", id], enabled: kind === "bazar" && !!id, queryFn: async () => (await api.get(`/bazar/${id}`)).data.data as Item });

  const src = kind === "document" ? doc.data : item.data;
  const isRental = kind === "bazar" && item.data?.tx === "ALQUILER";
  const available = kind === "document" ? !!doc.data : item.data?.status === "AVAILABLE";

  const buy = async () => {
    // Sin sesión: el modal se abre sobre esta página; al entrar, el usuario sigue aquí.
    if (!user) return openAuth();
    const rErr = isRental ? rentalError(rental.start, rental.end) : "";
    if (rErr) return setErr(rErr);
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { itemType: kind, itemId: id };
      if (isRental) {
        body.rentalStart = new Date(`${rental.start}T00:00:00`).toISOString();
        body.rentalEnd = new Date(`${rental.end}T23:59:00`).toISOString();
      }
      const r = await api.post("/orders", body);
      nav(ROUTES.checkout(r.data.data.id));
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return {
    loading: doc.isLoading || item.isLoading,
    doc: doc.data,
    item: item.data,
    src,
    person: (kind === "document" ? doc.data?.author?.profile : item.data?.seller?.profile) ?? null,
    quote: computePrice(src?.priceCents ?? 0, PLATFORM_FEE_PCT),
    payQr: resolveQr(src?.payQrUrl),
    isRental,
    available,
    loggedIn: !!user,
    rental,
    setRental,
    err,
    busy,
    buy,
  };
}

export type Detail = ReturnType<typeof useDetail>;
