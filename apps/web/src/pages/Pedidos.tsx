import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LIVE_ORDER_STATUS } from "@hub/shared";
import { api, pen, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { ROUTES } from "../lib/routes";
import { LoginRequired } from "../components/auth/LoginRequired";
import { BuyerOrderRow } from "../components/orders/BuyerOrderRow";
import { ListRowSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";

type Filter = "all" | "curso" | "digital" | "done";
const isLive = (o: HubOrder) => (LIVE_ORDER_STATUS as readonly string[]).includes(o.status);
const MATCH: Record<Filter, (o: HubOrder) => boolean> = { all: () => true, curso: isLive, digital: (o) => o.itemType === "document", done: (o) => o.status === "RELEASED" };
const STEPS = [
  ["Paga al vendedor", "Yape o Plin directo a su QR."],
  ["Declara tu pago", "Envía tu n° de operación o voucher."],
  ["Custodia", "El vendedor confirma el abono y el pedido queda en custodia."],
  ["Confirma la recepción", "Cuando verificas tu pedido, se cierra la venta."],
];

// /pedidos: compras del usuario con el flujo de custodia explicado.
export function Pedidos() {
  const { user } = useAuth();
  const { career } = useCareerTheme();
  const cc = careerContent(career);
  const [filter, setFilter] = useState<Filter>("all");
  const orders = useQuery({ queryKey: ["orders", "mine"], enabled: !!user, queryFn: async () => (await api.get("/orders/mine")).data.data as HubOrder[] });
  if (!user) return <LoginRequired what="ver tus pedidos" />;

  const list = orders.data ?? [];
  const count = (f: Filter) => list.filter(MATCH[f]).length;
  const rows = list.filter(MATCH[filter]);
  const stats = [
    { label: "En curso", value: String(count("curso")) },
    { label: "En custodia", value: pen(list.filter((o) => o.status === "ESCROW").reduce((a, o) => a + o.amountCents, 0)) },
    { label: "Completados", value: String(count("done")) },
    { label: "Total", value: String(list.length) },
  ];
  const tabs: [Filter, string][] = [["all", "Todos"], ["curso", "En curso"], ["digital", "Digitales"], ["done", "Completados"]];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Compras protegidas</p>
          <h1 className="h-display mt-2 text-3xl sm:text-4xl">Mis pedidos</h1>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.mySales} className="btn btn-secondary">Mis ventas</Link>
          <Link to={ROUTES.explore} className="btn btn-primary">Explorar</Link>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <dt className="text-xs font-bold text-zinc-600">{s.label}</dt>
            <dd className="price mt-1 text-3xl text-zinc-950">{orders.isLoading ? "…" : s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div role="tablist" aria-label="Filtrar pedidos" className="flex gap-2 overflow-x-auto p-1">
            {tabs.map(([v, l]) => (
              <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`chip ${filter === v ? "chip-active" : ""}`}>{l} ({count(v)})</button>
            ))}
          </div>
          {orders.isLoading && <ListRowSkeleton count={4} />}
          {!orders.isLoading && rows.length === 0 && (
            <EmptyState boxed icon="inbox" title={list.length === 0 ? "Aún no tienes pedidos" : "Nada en este filtro"} action={list.length === 0 ? <Link to={ROUTES.explore} className="btn btn-primary btn-sm">Compra tu primer apunte</Link> : undefined} />
          )}
          {rows.map((o) => <BuyerOrderRow key={o.id} order={o} />)}
        </div>
        <aside className="flex flex-col gap-4 lg:col-span-4">
          <div className="card p-5">
            <h2 className="font-extrabold text-zinc-950">¿Cómo funciona la custodia?</h2>
            <ol className="mt-4 flex flex-col gap-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="price flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary text-xs text-primary-ink">{i + 1}</span>
                  <span><b className="block text-sm text-zinc-950">{t}</b><span className="text-xs text-zinc-600">{d}</span></span>
                </li>
              ))}
            </ol>
            <Link to={ROUTES.mySales} className="btn btn-secondary btn-sm mt-5 w-full">¿Problemas? Abrir un reporte</Link>
          </div>
          <div className="card p-5">
            <h2 className="font-extrabold text-zinc-950">Puntos de entrega sugeridos</h2>
            <ul className="mt-3 divide-y divide-dashed divide-zinc-300 text-sm">
              {cc.meetSpots.map((s, i) => (
                <li key={s} className="flex justify-between gap-3 py-2"><span className="font-bold">{s}</span><span className="text-zinc-500">{cc.meetTimes[i]}</span></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
