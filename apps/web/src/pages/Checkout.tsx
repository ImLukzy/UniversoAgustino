import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api, type HubOrder } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { useAuth } from "../auth/AuthContext";
import { useAuthModal } from "../components/AuthModalHost";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { TeamPayPanel } from "../components/checkout/TeamPayPanel";
import { ReservationTimer } from "../components/checkout/ReservationTimer";
import { StatusTimeline } from "../components/checkout/StatusTimeline";
import { EscrowStatus, ExpiredState } from "../components/checkout/EscrowStatus";
import { BuyerCaseView } from "../components/orders/BuyerCaseView";
import { SPRING } from "../lib/motion";
const TTL_REASONS = ["TTL_EXPIRED", "TTL_BACKFILL"];
function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={SPRING}
      className="rounded-2xl border border-zinc-100 bg-white p-5"
    >
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-zinc-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs text-primary">{n}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col gap-4 bg-white px-4 py-8">{children}</div>;
}

// Checkout digital y coordinación de entregas físicas.
export function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const qc = useQueryClient();
  const [expired, setExpired] = useState(false);
  // Vuelta de Mercado Pago (?payment_id=…): el webhook puede tardar unos segundos.
  const [search] = useSearchParams();
  const backFromGateway = search.has("payment_id");

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await api.get(`/orders/${orderId}`)).data.data as HubOrder,
    enabled: !!user && !!orderId,
    // En PAID esperamos la confirmación del vendedor → ESCROW; tras la
    // pasarela, el webhook (PENDING → ESCROW).
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      if (backFromGateway && (st === "PENDING" || st === "ACCEPTED")) return 3_000;
      return st === "PAID" || (st === "PENDING" && q.state.data?.itemType === "bazar") ? 30_000 : false;
    },
  });
  const o = order.data;

  if (!user) {
    return (
      <Shell>
        <p className="text-center text-sm text-zinc-500">
          <button type="button" onClick={openAuth} className="font-semibold text-primary underline">Inicia sesión</button> para finalizar tu compra.
        </p>
      </Shell>
    );
  }
  if (order.isLoading) {
    return (
      <Shell>
        {[7, 24, 10].map((h) => <div key={h} className="animate-pulse rounded-2xl bg-zinc-100" style={{ height: `${h}rem` }} />)}
      </Shell>
    );
  }
  if (!o || o.buyerId !== user.id) {
    return (
      <Shell>
        <p className="text-center font-semibold text-zinc-900">Este pedido no es tuyo o ya no existe.</p>
        <Link className="text-center text-sm font-semibold text-primary underline" to={ROUTES.myOrders}>Ver mis pedidos</Link>
      </Shell>
    );
  }

  if (o.itemType === "bazar") return <Shell><h1 className="font-display text-2xl font-bold">Coordinación del pedido</h1><OrderSummary order={o} /><BuyerCaseView orderId={o.id} /><Link to={ROUTES.myOrders} className="btn btn-secondary">Ver mis pedidos</Link></Shell>;
  const rental = false;
  const payable = o.status === "ACCEPTED" || o.status === "PENDING" || (o.status === "PAID" && !!o.paymentRejectedReason);
  const isExpired = expired || (o.status === "CANCELLED" && TTL_REASONS.includes(o.cancelledReason ?? ""));
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["order", orderId] });
    void qc.invalidateQueries({ queryKey: ["orders", "mine"] });
  };
  const onExpire = () => {
    setExpired(true);
    refresh();
  };

  return (
    <Shell>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900">Checkout</h1>
          {o.status === "PENDING" && o.expiresAt && !isExpired && <ReservationTimer expiresAt={o.expiresAt} onExpire={onExpire} />}
        </div>
        <p className="text-sm text-zinc-500">Pagas al equipo y subes la foto del comprobante. Al verificar el abono, se habilitan el apunte y su descarga permanente.</p>
        {!isExpired && <div className="pt-2"><StatusTimeline status={o.status} rental={rental} /></div>}
      </header>

      <Block n={1} title="Resumen">
        <OrderSummary order={o} />
      </Block>

      <AnimatePresence mode="wait" initial={false}>
        {isExpired ? (
          <Block key="expired" n={2} title="Reserva">
            <ExpiredState order={o} />
          </Block>

        ) : payable ? (
          <Block key="pay" n={2} title="Paga a una cuenta del equipo">
            {o.paymentRejectedReason && <p role="alert" className="mb-4 break-words text-sm text-[#b91c1c]">Comprobante denegado: {o.paymentRejectedReason}. Puedes reenviarlo.</p>}
            <TeamPayPanel orderId={o.id} amountCents={o.amountCents} onPaid={refresh} />
          </Block>
        ) : (
          <Block key={`status-${o.status}`} n={rental && o.status === "PENDING" ? 2 : 3} title="Estado de custodia">
            <EscrowStatus order={o} />
          </Block>
        )}
      </AnimatePresence>
    </Shell>
  );
}
