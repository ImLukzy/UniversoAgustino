import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError, pen, type HubOrder } from "../lib/api";
import { useCareerTheme } from "../live/careerTheme";
import { getOrderLabel } from "../lib/orderLabels";

function o_date(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

// Sprint 2A: el título viene del snapshot del pedido (itemTitle).
// Cero peticiones por fila (antes: 1 GET /documents|bazar por fila).
function OrderTitle({ order }: { order: HubOrder }) {
  const to = order.itemType === "document" ? `/v/${order.itemId}` : `/p/bazar/${order.itemId}`;
  const title = order.itemTitle?.trim() || `${order.itemType} · ${order.itemId.slice(0, 8)}…`;
  return <Link to={to} className="font-semibold hover:underline">{title}</Link>;
}

export function PanelOrderRow({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.post(`/orders/${order.id}/confirm-receipt`);
      void qc.invalidateQueries({ queryKey: ["orders", "mine"] });
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const isDoc = order.itemType === "document";
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container lg:flex-row lg:items-center">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm" style={{}}>
          <span className="material-symbols-outlined text-2xl">{isDoc ? "picture_as_pdf" : "storefront"}</span>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-bold">#ORD-{order.id.slice(0, 4).toUpperCase()}</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {isDoc ? "Digital" : "Bazar"} · {order.itemType}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-primary">{getOrderLabel(order.status, "buyer", order.cancelledReason)}</span>
          </div>
          <h4 className="mt-1 text-sm font-bold"><OrderTitle order={order} /></h4>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600">
            <span>{o_date(order.createdAt)}</span>
            <span>•</span>
            <span>{pen(order.amountCents)}</span>
            {order.payProof && (<><span>•</span><span>Constancia: <b>{order.payProof}</b></span></>)}
          </div>
          {msg && <p className="mt-1 text-xs font-semibold text-red-600">{msg}</p>}
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-3 self-end lg:w-auto lg:self-center">
        <div className="text-right">
          <div className="font-display text-lg font-extrabold">{pen(order.amountCents)}</div>
          <span className="text-[11px] text-slate-600">Protegido en custodia</span>
        </div>
        <div className="flex items-center gap-1">
          {order.status === "PENDING" && (
            <Link to={`/checkout/${order.id}`} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110">
              Continuar pago
            </Link>
          )}
          {order.status === "ESCROW" && (
            <button disabled={busy} onClick={confirm} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50">
              Liberar fondos
            </button>
          )}
          {(order.status === "RELEASED" || order.status === "PAID") && (
            <Link to={`/checkout/${order.id}`} className="rounded-lg bg-white p-2 text-slate-500 shadow-sm transition-all hover:bg-slate-50" title="Ver detalle">
              <span className="material-symbols-outlined text-lg">info</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
