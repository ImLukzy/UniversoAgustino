import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, fmtDate, pen, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
import { getOrderLabel } from "../lib/orderLabels";

function PedidoRow({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const isDoc = order.itemType === "document";
  // Sprint 2B: título del snapshot (itemTitle). Cero fetches por fila.

  const mutate = async (path: string, okMsg?: string) => {
    setBusy(true);
    setMsg("");
    try {
      await api.post(path);
      if (okMsg) setMsg(okMsg);
      void qc.invalidateQueries({ queryKey: ["orders", "mine"] });
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold">#ORD-{order.id.slice(0, 4).toUpperCase()}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
            {isDoc ? (order.status === "RELEASED" ? "Digital" : "Apunte") : "Bazar"}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary" style={accent ? { color: accent.color } : undefined}>
            {getOrderLabel(order.status, "buyer", order.cancelledReason)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Total:</span>
          <span className="font-display text-lg font-extrabold">{pen(order.amountCents)}</span>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-primary shadow-sm" style={accent ? { color: accent.color } : undefined}>
          <span className="material-symbols-outlined text-2xl">{isDoc ? "picture_as_pdf" : "storefront"}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate font-bold">
            {order.itemTitle?.trim() || `${order.itemType} · ${order.itemId.slice(0, 8)}…`}
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
            <span>•</span>
            <span>Fee {pen(order.feeCents)}</span>
            {order.rentalStart && order.rentalEnd && (
              <><span>•</span><span>Alquiler: <b>{fmtDate(order.rentalStart)} → {fmtDate(order.rentalEnd)}</b></span></>
            )}
            {order.payProof && (<><span>•</span><span>Constancia: <b>{order.payProof}</b></span></>)}
          </div>
          {msg && <p className="mt-1 text-xs font-semibold text-red-600">{msg}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <span className="text-xs text-slate-400">
          {order.status === "ESCROW" && "No liberes el pago hasta verificar tu pedido."}
          {order.status === "PENDING" && (order.rentalStart ? "Esperando que el vendedor acepte tu alquiler." : "Paga al vendedor para continuar.")}
          {order.status === "ACCEPTED" && "Solicitud aceptada. Ya puedes pagar."}
          {order.status === "PAID" && "El vendedor debe confirmar tu pago."}
          {order.status === "RELEASED" && "Pedido completado."}
          {order.status === "CANCELLED" && getOrderLabel(order.status, "buyer", order.cancelledReason)}
        </span>
        <div className="flex items-center gap-1.5">
          {(order.status === "PENDING" || order.status === "ACCEPTED") && (
            <>
              <Link to={`/checkout/${order.id}`} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110" style={accent ? { backgroundColor: accent.color } : undefined}>
                {order.status === "ACCEPTED" ? "Pagar ahora" : "Continuar pago"}
              </Link>
              <button disabled={busy} onClick={() => mutate(`/orders/${order.id}/cancel`, "Pedido cancelado.")} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                Cancelar
              </button>
            </>
          )}
          {order.status === "PAID" && (
            <Link to={`/checkout/${order.id}`} className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold transition-all hover:bg-slate-300">
              Ver estado
            </Link>
          )}
          {order.status === "ESCROW" && (
            <button disabled={busy} onClick={() => mutate(`/orders/${order.id}/confirm-receipt`)} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110 disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
              Confirmar recepción
            </button>
          )}
          {order.status === "RELEASED" && isDoc && order.fileUrl ? (
            <a href={order.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110">
              <span className="material-symbols-outlined text-base">download</span> Descargar
            </a>
          ) : order.status === "RELEASED" && isDoc ? (
            <Link to={`/v/${order.itemId}`} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-all hover:brightness-110">
              <span className="material-symbols-outlined text-base">visibility</span> Abrir apunte
            </Link>
          ) : null}
          {order.status === "RELEASED" && !isDoc && (
            <Link to={`/p/bazar/${order.itemId}`} className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold transition-all hover:bg-slate-300">
              Ver publicación
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function Pedidos() {
  const { user } = useAuth();
  const { career, accent } = useCareerTheme();
  const cc = careerContent(career);
  const [filter, setFilter] = useState<"all" | "curso" | "digital" | "done">("all");

  const orders = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get("/orders/mine")).data.data as HubOrder[],
    enabled: !!user,
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para ver pedidos.
        </div>
      </main>
    );
  }

  const list = orders.data ?? [];
  const curso = list.filter((o) => ["PENDING", "ACCEPTED", "PAID", "ESCROW"].includes(o.status));
  const escrowSum = list.filter((o) => o.status === "ESCROW").reduce((a, o) => a + o.amountCents, 0);
  const done = list.filter((o) => o.status === "RELEASED");
  const digital = list.filter((o) => o.itemType === "document");
  const filtered = list.filter((o) => {
    if (filter === "curso") return ["PENDING", "ACCEPTED", "PAID", "ESCROW"].includes(o.status);
    if (filter === "digital") return o.itemType === "document";
    if (filter === "done") return o.status === "RELEASED";
    return true;
  });

  const stats = [
    { label: "En curso", icon: "local_shipping", wrap: "", value: String(curso.length), sub: "pedidos activos", subCls: "text-indigo-700" },
    { label: "Custodia Escrow", icon: "lock", wrap: "bg-primary/10 text-primary", value: pen(escrowSum), valueCls: "text-primary", sub: `${escrowOrders(list)} activos · Fondos protegidos` },
    { label: "Completados", icon: "folder_zip", wrap: "bg-emerald-50 text-emerald-700", value: String(done.length), sub: "acceso permanente" },
    { label: "Total", icon: "task_alt", wrap: "bg-slate-200 text-slate-600", value: String(list.length), sub: "registros" },
  ];

  const filters = [["all", `Todos (${list.length})`], ["curso", `En curso (${curso.length})`], ["digital", `Digitales (${digital.length})`], ["done", `Completados (${done.length})`]] as const;

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex flex-col">
          <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Panel estudiantil · Garantía escrow
          </p>
          <h1 className="font-display text-3xl tracking-tight">Mis Pedidos y Entregas</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Tus apuntes y compras de bazar en custodia, bajo la Ley D.L. 822.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link to="/publicaciones" className="flex items-center gap-1 rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold shadow-sm transition-colors hover:bg-slate-300">
            <span className="material-symbols-outlined text-sm text-primary" style={accent ? { color: accent.color } : undefined}>storefront</span>
            <span>Mis ventas</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110" style={accent ? { backgroundColor: accent.color } : undefined}>
            <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
            <span>Nuevo pedido</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm">
            <span className="material-symbols-outlined pointer-events-none absolute -bottom-3 -right-3 select-none text-[80px] text-slate-100">{s.icon}</span>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${s.wrap}`}>
                <span className="material-symbols-outlined text-sm">{s.icon === "local_shipping" ? "sync" : s.icon === "lock" ? "shield" : s.icon === "folder_zip" ? "menu_book" : "sentiment_satisfied"}</span>
              </span>
            </div>
            <div className="z-10 flex items-baseline gap-1">
              <span className={`font-display text-3xl leading-none ${s.valueCls ?? ""}`} style={s.valueCls === "text-primary" && accent ? { color: accent.color } : undefined}>
                {orders.isLoading ? "…" : s.value}
              </span>
            </div>
            <div className={`z-10 mt-2 text-xs ${s.subCls ?? "text-slate-400"}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {filters.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${filter === v ? "bg-primary text-white shadow-sm" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
            style={filter === v && accent ? { backgroundColor: accent.color } : undefined}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Lista */}
        <div className="flex flex-col gap-3 lg:col-span-8">
          {orders.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {!orders.isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-1 rounded-xl bg-white px-4 py-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300">inbox</span>
              <p className="mt-2 text-sm text-slate-400">{list.length === 0 ? "Aún no tienes pedidos" : "Nada en este filtro"}</p>
              {list.length === 0 && (
                <Link to="/" className="text-sm font-bold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>
                  Compra tu primer apunte →
                </Link>
              )}
            </div>
          )}
          {filtered.map((o) => <PedidoRow key={o.id} order={o} />)}
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-slate-100 via-white to-slate-100 p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold">¿Buscas material de tu ciclo?</span>
                <span className="text-xs text-slate-500">Explora apuntes y bazar con sello D.L. 822.</span>
              </div>
            </div>
            <Link to="/bazar" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-slate-300" style={accent ? { color: accent.color } : undefined}>
              <span>Ver bazar</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Rail */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-1 font-display font-bold">
              <span className="material-symbols-outlined text-primary" style={accent ? { color: accent.color } : undefined}>security</span>
              ¿Cómo funciona la custodia?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              En Universo Agustino Arequipa, tu dinero no llega al vendedor hasta que confirmes recepción.
            </p>
            <div className="relative mt-3 flex flex-col gap-4 before:absolute before:bottom-2 before:left-3.5 before:top-2 before:w-0.5 before:bg-slate-200">
              {[
                ["1", "Paga al vendedor", "Yape o Plin directo a su QR. El pedido queda en espera."],
                ["2", "Declara tu pago", "Marca «Ya pagué» con tu n° de operación para avisarle."],
                ["3", "Confirma y libera", "Al recibir, confirma y el vendedor cobra de inmediato."],
              ].map(([n, t, d]) => (
                <div key={n} className="relative flex items-start gap-3">
                  <div
                    className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${n === "3" ? "bg-emerald-700 text-white" : "bg-primary text-white"}`}
                    style={n !== "3" && accent ? { backgroundColor: accent.color } : undefined}
                  >
                    {n}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold leading-tight">{t}</h4>
                    <p className="mt-0.5 text-xs text-slate-500">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-1 text-xs font-bold text-primary" style={accent ? { color: accent.color } : undefined}>
                <span className="material-symbols-outlined text-sm">support_agent</span>
                <span>¿Problemas con algún pedido?</span>
              </p>
              <p className="text-xs text-slate-500">Cancelaciones y reembolsos según el marco legal.</p>
              <Link to="/legal" className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white transition-all hover:brightness-110">
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>Ver marco legal y reportes</span>
              </Link>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-sm text-primary" style={accent ? { color: accent.color } : undefined}>location_city</span>
              Puntos de entrega
            </h3>
            <p className="mb-2 text-xs text-slate-500">Zonas seguras de intercambio:</p>
            <div className="flex flex-col gap-1.5">
              {cc.meetSpots.map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" style={accent ? { color: accent.color } : undefined}>
                      {s.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    {s}
                  </span>
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                </div>
              ))}
              <p className="px-1 text-[11px] text-slate-400">{cc.meetTimes.join(" · ")}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function escrowOrders(list: HubOrder[]) {
  return list.filter((o) => o.status === "ESCROW").length;
}
