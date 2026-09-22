import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api, apiError, pen, type HubOrder } from "../lib/api";
import { useToast } from "../context/ToastContext";

// Acciones del vendedor sobre sus ventas (Sprint 2B). Unifica los botones
// que estaban duplicados en Ventas.tsx y Publicaciones.tsx (SaleRow).
// Recibe el color de acento por props para no acoplarse al tema de carrera.
// Sprint 3: éxito y error van por toast (accionable y persistente el error).
// Craftsmanship: motion.button con tap spring (misma física que las cards);
// clases y layout intactos (flex-1 del primario preservado).
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
          <motion.button
            disabled={busy}
            onClick={() => act(`/orders/${order.id}/accept`, "Alquiler aceptado. Avisamos al comprador para que pague.")}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={accent}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span className="material-symbols-outlined text-sm">check</span> Aceptar alquiler
          </motion.button>
          <motion.button
            disabled={busy}
            onClick={() => act(`/orders/${order.id}/cancel`, "Solicitud denegada.")}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            Denegar
          </motion.button>
        </>
      )}
      {order.status === "PAID" && (
        <motion.button
          disabled={busy}
          onClick={() => act(`/orders/${order.id}/confirm-payment`, "Pago confirmado → en custodia.")}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="material-symbols-outlined text-sm">verified</span>
          Confirmar recepción de pago ({pen(order.amountCents)})
        </motion.button>
      )}
      {(order.status === "PENDING" || order.status === "ACCEPTED" || order.status === "PAID") && (
        <motion.button
          disabled={busy}
          onClick={() => act(`/orders/${order.id}/cancel`, "Venta cancelada.")}
          className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50"
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          Cancelar
        </motion.button>
      )}
    </div>
  );
}
