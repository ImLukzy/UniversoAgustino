import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { pen, type HubOrder } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { SPRING } from "../../lib/motion";

const COPY: Record<string, { icon: string; title: string; body: string }> = {
  PENDING: { icon: "schedule", title: "Esperando al vendedor", body: "Debe aceptar tu solicitud de alquiler antes de que puedas pagar. Te avisaremos aquí mismo." },
  PAID: { icon: "hourglass_top", title: "Pago declarado", body: "El vendedor está verificando el abono. Al confirmarlo, tu dinero pasa a custodia." },
  ESCROW: { icon: "verified_user", title: "Dinero en custodia", body: "Retenemos el pago hasta que confirmes que recibiste el producto en Mis pedidos." },
  RELEASED: { icon: "check_circle", title: "Pedido completado", body: "Liberamos el pago al vendedor. ¡Gracias por comprar en la comunidad!" },
  CANCELLED: { icon: "cancel", title: "Pedido cancelado", body: "Este pedido ya no está activo." },
  REFUNDED: { icon: "cancel", title: "Pago reembolsado", body: "El monto se devolvió al comprador." },
};

// Paso 3 · Estado de custodia (escrow). El check final entra con escala.
export function EscrowStatus({ order }: { order: HubOrder }) {
  const c = COPY[order.status] ?? COPY.PENDING;
  const good = order.status === "ESCROW" || order.status === "RELEASED";
  // Apunte: el pago verificado (ESCROW) ya desbloquea el documento completo (spec 16).
  const doc = order.itemType === "document";
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING}
        className={`flex h-14 w-14 items-center justify-center rounded-full ${good ? "bg-primary text-primary-ink" : "bg-zinc-100 text-zinc-500"}`}
      >
        <span className="material-symbols-outlined text-3xl">{c.icon}</span>
      </motion.span>
      <div>
        <p className="font-display text-lg font-bold text-zinc-900">{c.title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500">
          {doc && order.status === "PAID" ? "El vendedor está verificando el abono. Al confirmarlo se desbloquea el documento completo." : doc && order.status === "ESCROW" ? "Pago verificado: ya tienes acceso completo al documento." : c.body}
        </p>
      </div>
      {order.status === "ESCROW" && (
        <p className="text-xs text-zinc-500">{pen(order.netCents)} llegarán al vendedor cuando confirmes la recepción.</p>
      )}
      {doc && good && (
        <Link to={ROUTES.document(order.itemId)} className="btn btn-primary">
          <span className="material-symbols-outlined text-xl">menu_book</span>
          Abrir el documento
        </Link>
      )}
      <Link to={ROUTES.myOrders} className="text-sm font-semibold text-primary hover:underline">Ir a Mis pedidos</Link>
    </div>
  );
}

// Reserva vencida: CTA para volver al ítem y generar un nuevo pedido.
export function ExpiredState({ order }: { order: HubOrder }) {
  const back = order.itemType === "document" ? ROUTES.document(order.itemId) : ROUTES.bazarItem(order.itemId);
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <span className="material-symbols-outlined text-3xl">timer</span>
      </span>
      <p className="font-display text-lg font-bold text-zinc-900">Reserva expirada</p>
      <p className="max-w-xs text-sm text-zinc-500">El tiempo para pagar terminó y el producto se liberó. Puedes reservarlo de nuevo si sigue disponible.</p>
      <Link to={back} className="btn btn-primary mt-1">Volver al producto</Link>
    </div>
  );
}
