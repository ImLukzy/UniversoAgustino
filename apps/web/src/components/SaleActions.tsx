import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError, pen, type HubOrder } from "../lib/api";
import { useToast } from "../context/ToastContext";

// Acciones del vendedor sobre sus ventas (Sprint 2B). Unifica los botones
// que estaban duplicados en Ventas.tsx y Publicaciones.tsx (SaleRow).
// Recibe el color de acento por props para no acoplarse al tema de carrera.
// Sprint 3: éxito y error van por toast (accionable y persistente el error).
export function SaleActions({ order, accentColor }: { order: HubOrder; accentColor?: string | null }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const act = async (path: string, okMsg: string) => {
    setBusy(true);
    try {
      await api.post(path);
      toast.success(okMsg);
      void qc.invalidateQueries({ queryKey: ["orders", "sales"] });
    } catch (e) {
      toast.error("No se pudo completar la acción", apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const accent = accentColor ? { backgroundColor: accentColor } : undefined;
  return (
    <div className="flex flex-wrap items-center gap-2">
        {order.status === "PENDING" && order.itemType === "bazar" && (
          <>
            <button disabled={busy} onClick={() => act(`/orders/${order.id}/accept`, "Alquiler aceptado. Avisamos al comprador para que pague.")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50" style={accent}>
              <span className="material-symbols-outlined text-sm">check</span> Aceptar alquiler
            </button>
            <button disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, "Solicitud denegada.")} className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50">
              Denegar
            </button>
          </>
        )}
        {order.status === "PAID" && (
          <button disabled={busy} onClick={() => act(`/orders/${order.id}/confirm-payment`, "Pago confirmado → en custodia.")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50">
            <span className="material-symbols-outlined text-sm">verified</span>
            Confirmar recepción de pago ({pen(order.amountCents)})
          </button>
        )}
        {(order.status === "PENDING" || order.status === "ACCEPTED" || order.status === "PAID") && (
          <button disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, "Venta cancelada.")} className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50">
            Cancelar
          </button>
        )}
    </div>
  );
}
