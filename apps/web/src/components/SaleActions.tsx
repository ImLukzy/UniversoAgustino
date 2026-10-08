import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError, pen, type HubOrder } from "../lib/api";
import { useToast } from "../context/ToastContext";

// Acciones del vendedor sobre una venta (aceptar alquiler, confirmar pago,
// cancelar). Éxito y error van por toast. Única fuente para /ventas y /publicaciones.
export function SaleActions({ order }: { order: HubOrder }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const act = async (path: string, okMsg: string, body?: { reason: string }) => {
    setBusy(true);
    try {
      await api.post(path, body);
      setRejecting(false); setReason("");
      toast.success(okMsg);
      void qc.invalidateQueries({ queryKey: ["orders", "sales"] });
    } catch (e) {
      toast.error("No se pudo completar la acción", apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const can = (...st: string[]) => st.includes(order.status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {can("PENDING") && order.itemType === "bazar" && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/accept`, "Solicitud aceptada. Avisamos al comprador para que pague.")} className="btn btn-primary btn-sm flex-1">
          <span className="material-symbols-outlined text-base">check</span> Aceptar
        </button>
      )}
      {can("PAID") && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/confirm-payment`, "Pago confirmado: el pedido pasa a custodia.")} className="btn btn-primary btn-sm flex-1">
          <span className="material-symbols-outlined text-base">verified</span> Confirmar pago ({pen(order.amountCents)})
        </button>
      )}
      {can("PENDING") && order.itemType === "bazar" && <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="btn btn-secondary btn-sm">Rechazar</button>}
      {((can("PENDING") && order.itemType !== "bazar") || can("ACCEPTED", "PAID")) && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, order.status === "PENDING" && order.itemType === "bazar" ? "Solicitud denegada." : "Venta cancelada.")} className="btn btn-secondary btn-sm">
          {order.status === "PENDING" && order.itemType === "bazar" ? "Denegar" : "Cancelar"}
        </button>
      )}
      {rejecting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <form role="dialog" aria-modal="true" aria-labelledby={`reject-${order.id}`} className="card flex w-full max-w-md flex-col gap-4 p-5"
          onKeyDown={(e) => { if (e.key === "Escape" && !busy) setRejecting(false); }}
          onSubmit={(e) => { e.preventDefault(); if (reason.trim().length >= 5) void act(`/orders/${order.id}/reject`, "Solicitud rechazada. Avisamos al comprador.", { reason: reason.trim() }); }}>
          <h2 id={`reject-${order.id}`} className="font-bold">Rechazar solicitud</h2>
          <label htmlFor={`reason-${order.id}`} className="text-sm">Motivo (5–300 caracteres)</label>
          <textarea autoFocus id={`reason-${order.id}`} required minLength={5} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-24 w-full" />
          <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || reason.trim().length < 5} className="btn btn-primary">Rechazar</button>
            <button type="button" disabled={busy} onClick={() => setRejecting(false)} className="btn btn-secondary">Volver</button></div>
        </form>
      </div>}
    </div>
  );
}
