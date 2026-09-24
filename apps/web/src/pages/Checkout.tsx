import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api, type HubOrder } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { useAuth } from "../auth/AuthContext";
import { useAuthModal } from "../components/AuthModalHost";
import { OrderSummary } from "../components/checkout/OrderSummary";
import { PayMethodPanel } from "../components/checkout/PayMethodPanel";
import { ProofForm } from "../components/checkout/ProofForm";
import { ReservationTimer } from "../components/checkout/ReservationTimer";
import { StatusTimeline } from "../components/checkout/StatusTimeline";
import { EscrowStatus, ExpiredState } from "../components/checkout/EscrowStatus";
import { GatewayPay, usePayProvider } from "../components/checkout/GatewayPay";
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
  return <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col gap-4 bg-white px-4 py-8">{children}</main>;
}

// Checkout escrow (spec 09): una columna, 3 pasos — Resumen → Pagar (QR +
// constancia) → Custodia. Solo el comprador lo ve; la máquina de estados vive
// en el backend y aquí solo se refleja.
export function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const qc = useQueryClient();
  const [expired, setExpired] = useState(false);
  const provider = usePayProvider();
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
      return st === "PAID" ? 30_000 : false;
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

  const rental = o.itemType === "bazar" && !!o.rentalStart;
  const payable = o.status === "ACCEPTED" || (o.status === "PENDING" && !rental);
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
        <p className="text-sm text-zinc-500">Pagas directo al vendedor y el dinero queda en custodia hasta que confirmes la entrega.</p>
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
          provider === "mercadopago" ? (
            <Block key="gateway" n={2} title="Paga con Mercado Pago">
              <GatewayPay order={o} />
            </Block>
          ) : (
            <Block key="pay" n={2} title="Paga con Yape o Plin">
              <PayMethodPanel order={o} />
              <div className="mt-5 border-t border-zinc-100 pt-5">
                <ProofForm orderId={o.id} onPaid={refresh} />
              </div>
            </Block>
          )
        ) : (
          <Block key={`status-${o.status}`} n={rental && o.status === "PENDING" ? 2 : 3} title="Estado de custodia">
            <EscrowStatus order={o} />
          </Block>
        )}
      </AnimatePresence>
    </Shell>
  );
}
