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
  const can = (...st: string[]) => st.includes(order.status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {can("PENDING") && order.itemType === "bazar" && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/accept`, "Alquiler aceptado. Avisamos al comprador para que pague.")} className="btn btn-primary btn-sm flex-1">
          <span className="material-symbols-outlined text-base">check</span> Aceptar alquiler
        </button>
      )}
      {can("PAID") && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/confirm-payment`, "Pago confirmado: el pedido pasa a custodia.")} className="btn btn-primary btn-sm flex-1">
          <span className="material-symbols-outlined text-base">verified</span> Confirmar pago ({pen(order.amountCents)})
        </button>
      )}
      {can("PENDING", "ACCEPTED", "PAID") && (
        <button type="button" disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, order.status === "PENDING" && order.itemType === "bazar" ? "Solicitud denegada." : "Venta cancelada.")} className="btn btn-secondary btn-sm">
          {order.status === "PENDING" && order.itemType === "bazar" ? "Denegar" : "Cancelar"}
        </button>
      )}
    </div>
  );
}
