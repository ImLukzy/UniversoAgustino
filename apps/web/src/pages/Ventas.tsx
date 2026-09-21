import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, fmtDate, pen, type HubOrder, type HubReport } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerLabel } from "../data/unsa";
import { CareerAvatar } from "../components/CareerVisual";

const ORDER_LABEL: Record<string, string> = {
  PENDING: "Pendiente de aprobación",
  ACCEPTED: "Aceptado · pago en espera",
  PAID: "Pagado · por confirmar",
  ESCROW: "En custodia",
  RELEASED: "Completado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

function SaleActions({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const act = async (path: string, okMsg: string) => {
    setBusy(true);
    setMsg("");
    try {
      await api.post(path);
      setMsg(okMsg);
      qc.invalidateQueries({ queryKey: ["orders-sales"] });
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      {msg && <p className="text-xs font-semibold text-slate-600">{msg}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {order.status === "PENDING" && (
          <>
            <button disabled={busy} onClick={() => act(`/orders/${order.id}/accept`, "Alquiler aceptado. Avisamos al comprador para que pague.")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
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
        {order.status === "ACCEPTED" && (
          <button disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, "Solicitud cancelada.")} className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50">
            Cancelar
          </button>
        )}
        {order.status === "PAID" && (
          <button disabled={busy} onClick={() => act(`/orders/${order.id}/cancel`, "Venta cancelada.")} className="rounded-lg bg-slate-100 px-4 py-2 text-xs transition-colors hover:bg-slate-200 disabled:opacity-50">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function RentalCard({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  const buyerName = order.buyer?.profile?.fullName?.trim() || order.buyer?.email || "Comprador";
  const buyerMeta = [
    order.buyer?.profile?.career ? careerLabel(order.buyer.profile.career) : null,
    order.buyer?.profile?.cycle ? `Ciclo ${order.buyer.profile.cycle}` : null,
  ].filter(Boolean).join(" · ");
  const days = order.rentalStart && order.rentalEnd
    ? Math.max(1, Math.round((new Date(order.rentalEnd).getTime() - new Date(order.rentalStart).getTime()) / 86400000))
    : null;
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CareerAvatar name={buyerName} className="h-12 w-12" />
          <div className="flex min-w-0 flex-col">
            <p className="flex items-center gap-1 font-bold">
              <span className="truncate">{buyerName}</span>
              <span className="flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-800">
                <span className="material-symbols-outlined text-xs">verified</span> Verificado
              </span>
            </p>
            <p className="truncate text-xs text-slate-500">
              {buyerMeta || "Universo Agustino"}
              <span className="font-semibold text-emerald-700"> · ★ {order.buyerCompleted ?? 0} alquileres previos</span>
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-semibold text-indigo-800">
          {ORDER_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
        <span className="material-symbols-outlined text-2xl text-primary" style={accent ? { color: accent.color } : undefined}>storefront</span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>
            Alquiler de bazar
          </span>
          <span className="truncate font-bold">{order.itemTitle ?? order.itemId}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">event</span>
              {order.rentalStart && order.rentalEnd ? `${fmtDate(order.rentalStart)} → ${fmtDate(order.rentalEnd)}${days ? ` (${days} días)` : ""}` : "Fechas a coordinar"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-lg bg-slate-100 p-2">
          <span className="text-[11px] text-slate-500">Desglose económico</span>
          <span className="flex items-baseline justify-between text-xs"><span>Alquiler</span><b>{pen(order.amountCents)}</b></span>
          <span className="flex items-baseline justify-between text-xs text-slate-500"><span>Comisión (13%)</span><span>{pen(order.feeCents)}</span></span>
          <span className="mt-1 flex items-baseline justify-between rounded bg-slate-200/60 px-1 text-xs font-bold">
            <span>Total</span><span className="text-sm text-primary" style={accent ? { color: accent.color } : undefined}>{pen(order.amountCents)}</span>
          </span>
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-slate-100 p-2">
          <span className="text-[11px] text-slate-500">Cobro</span>
          <span className="text-xs font-bold">{order.payMethod === "PLIN" ? "Plin" : order.payMethod === "AMBAS" ? "Yape / Plin" : "Yape"}</span>
          <span className="truncate text-[11px] text-slate-500">{order.payDetail || "Ver en Mis publicaciones"}</span>
          {order.payProof && <span className="text-[11px]">Constancia: <b>{order.payProof}</b></span>}
        </div>
      </div>

      {order.status === "PAID" && (
        <div className="rounded-lg bg-indigo-50 p-2 text-xs text-indigo-900">
          El comprador declara el pago{order.payProof ? <> con constancia <b>{order.payProof}</b></> : ""}. Confírmalo solo si recibiste el abono en tu cuenta.
        </div>
      )}
      <SaleActions order={order} />
    </div>
  );
}

export function Ventas() {
  const { user } = useAuth();
  const { accent } = useCareerTheme();
  const [repFilter, setRepFilter] = useState<"all" | "open" | "done">("all");
  const [tType, setTType] = useState("bazar");
  const [tId, setTId] = useState("");
  const [reason, setReason] = useState("");
  const [repMsg, setRepMsg] = useState("");
  const [repBusy, setRepBusy] = useState(false);

  const sales = useQuery({
    queryKey: ["orders-sales"],
    queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[],
    enabled: !!user,
  });
  const reports = useQuery({
    queryKey: ["reports-mine"],
    queryFn: async () => (await api.get("/reports/mine")).data.data as HubReport[],
    enabled: !!user,
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para gestionar tus ventas.
        </div>
      </main>
    );
  }

  const rows = sales.data ?? [];
  const rentals = rows.filter((o) => o.itemType === "bazar");
  const digitals = rows.filter((o) => o.itemType === "document");
  const pendingRentals = rentals.filter((o) => o.status === "PENDING");
  const digitalNet = digitals.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0);
  const openReports = (reports.data ?? []).filter((r) => r.status === "OPEN");
  const myReports = reports.data ?? [];
  const shownReports = myReports.filter((r) => {
    if (repFilter === "open") return r.status === "OPEN";
    if (repFilter === "done") return r.status !== "OPEN";
    return true;
  });

  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepBusy(true);
    setRepMsg("");
    try {
      await api.post("/reports", { targetType: tType, targetId: tId.trim(), reason: reason.trim() });
      setRepMsg("Reporte enviado. Lo revisaremos en menos de 48h.");
      setTId("");
      setReason("");
      reports.refetch();
    } catch (ex) {
      setRepMsg(apiError(ex));
    } finally {
      setRepBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="max-w-3xl space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-0.5 text-xs text-indigo-800">
            <span className="material-symbols-outlined text-sm">dashboard_customize</span>
            Módulo de ventas
          </span>
          <h1 className="font-display text-3xl tracking-tight">Panel de Gestión de Ventas</h1>
          <p className="text-sm text-slate-500">
            Administra solicitudes de alquiler de tu bazar, monitorea tus ventas digitales automáticas y gestiona tus reportes.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/pedidos" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold shadow-sm transition-all hover:bg-slate-200">
            <span className="material-symbols-outlined text-sm text-primary" style={accent ? { color: accent.color } : undefined}>receipt_long</span>
            <span>Mis pedidos</span>
          </Link>
          <Link to="/publicar" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-110" style={accent ? { backgroundColor: accent.color } : undefined}>
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Nueva publicación</span>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Alquileres pendientes</span>
            <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-800"><span className="material-symbols-outlined text-lg">storefront</span></span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-display text-3xl">{pendingRentals.length}</span>
            <span className="text-xs font-semibold text-indigo-700">por revisar</span>
          </div>
          <p className="text-xs text-slate-500">Requieren tu aceptación y tu QR</p>
          <a href="#seccion-alquileres" className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-indigo-700 hover:underline">
            Ver solicitudes <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </a>
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Ventas digitales (neto)</span>
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800"><span className="material-symbols-outlined text-lg">auto_mode</span></span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-display text-2xl text-emerald-700">{pen(digitalNet)}</span>
            <span className="text-xs font-semibold text-emerald-700">netos</span>
          </div>
          <p className="text-xs text-slate-500">Flujo automático, sin aprobación</p>
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Comisión de plataforma</span>
            <span className="rounded-lg bg-primary/10 p-1.5 text-primary" style={accent ? { color: accent.color } : undefined}><span className="material-symbols-outlined text-lg">account_balance</span></span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-display text-3xl text-primary" style={accent ? { color: accent.color } : undefined}>13%</span>
            <span className="text-xs font-semibold text-slate-500">tasa fija</span>
          </div>
          <p className="text-xs text-slate-500">Descuento automático D.L. 822</p>
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Mis casos abiertos</span>
            <span className="rounded-lg bg-slate-200 p-1.5 text-slate-600"><span className="material-symbols-outlined text-lg">gavel</span></span>
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-display text-3xl text-red-600">{openReports.length}</span>
            <span className="text-xs font-semibold text-red-600">reportes activos</span>
          </div>
          <p className="text-xs text-slate-500">Soporte en menos de 48h</p>
          <a href="#seccion-reportes" className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 hover:underline">
            Gestionar casos <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* Sección A */}
      <section className="space-y-3" id="seccion-alquileres">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 font-display text-xl">
              Solicitudes de alquiler
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">Control manual · Requiere acción</span>
            </h2>
            <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
              Acepta o deniega cada solicitud. Al aceptar, el comprador paga a tu QR; al confirmar su pago, el pedido pasa a custodia.
            </p>
          </div>
        </div>
        {sales.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
        {!sales.isLoading && rentals.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Sin solicitudes de alquiler. <Link to="/publicar" className="font-bold text-primary underline">Publica un artículo de bazar</Link>.
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rentals.map((o) => <RentalCard key={o.id} order={o} />)}
        </div>
      </section>

      {/* Sección B */}
      <section className="space-y-3" id="seccion-digitales">
        <div className="flex flex-col">
          <h2 className="flex flex-wrap items-center gap-2 font-display text-xl">
            Ventas digitales
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Flujo automático · Sin esperas</span>
          </h2>
          <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
            Tus apuntes se venden solos: el sistema descuenta el 13% y acredita tu neto. No necesitas aprobar cada compra.
          </p>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-2 text-primary" style={accent ? { color: accent.color } : undefined}>
              <span className="material-symbols-outlined text-xl">calculate</span>
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Fórmula de liquidación</span>
              <span className="text-xs text-slate-500">Transparencia total en cada venta.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 px-4 py-2 text-sm">
            <span className="font-bold">[Precio venta]</span>
            <span className="text-slate-400">-</span>
            <span className="font-semibold text-red-600">[Comisión 13%]</span>
            <span className="text-slate-400">=</span>
            <span className="font-bold text-emerald-700">[Neto para ti]</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Fecha &amp; archivo</th>
                  <th className="px-3 py-3">Comprador</th>
                  <th className="px-3 py-3 text-right">Precio</th>
                  <th className="px-3 py-3 text-right">Comisión</th>
                  <th className="px-3 py-3 text-right">Neto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {digitals.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-400">Aún no vendes apuntes.</td></tr>
                )}
                {digitals.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-1.5 text-primary" style={accent ? { color: accent.color } : undefined}>
                          <span className="material-symbols-outlined text-base">description</span>
                        </span>
                        <div className="flex min-w-0 flex-col">
                          <span className="max-w-xs truncate text-sm font-semibold md:max-w-md">{o.itemTitle ?? o.itemId}</span>
                          <span className="text-[11px] text-slate-500">{fmtDate(o.createdAt)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{o.buyer?.profile?.fullName?.trim() || o.buyer?.email || "—"}</span>
                        <span className="text-[11px] text-slate-500">{o.buyer?.profile?.career ? careerLabel(o.buyer.profile.career) : ""}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold">{pen(o.amountCents)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-sm text-red-600">-{pen(o.feeCents)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-extrabold text-emerald-700">+{pen(o.netCents)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">
                        {o.status === "RELEASED" ? "Completado" : ORDER_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sección C */}
      <section className="space-y-3" id="seccion-reportes">
        <div className="flex flex-col">
          <h2 className="flex flex-wrap items-center gap-2 font-display text-xl">
            Centro de soporte y reportes
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">Garantía estudiantil activa</span>
          </h2>
          <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
            Reporta devoluciones del bazar o problemas con archivos. Respondemos en menos de 48 horas.
          </p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {[["all", `Todas (${myReports.length})`], ["open", `Abiertas (${openReports.length})`], ["done", `Resueltas (${myReports.length - openReports.length})`]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setRepFilter(v as "all" | "open" | "done")}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${repFilter === v ? "bg-primary text-white shadow-sm" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
              style={repFilter === v && accent ? { backgroundColor: accent.color } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shownReports.length === 0 && (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm lg:col-span-2">
              Sin reportes en este filtro. Todo en orden.
            </div>
          )}
          {shownReports.map((r) => (
            <div key={r.id} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">Caso #{r.id.slice(0, 6).toUpperCase()}</p>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.status === "OPEN" ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {r.status === "OPEN" ? "Abierto" : r.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{r.targetType} · {r.targetId.slice(0, 8)}… · {fmtDate(r.createdAt)}</p>
              <p className="text-sm">“{r.reason}”</p>
            </div>
          ))}
        </div>
        <form onSubmit={sendReport} className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-bold">Abrir un reporte</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              Tipo de objetivo
              <select className="input" value={tType} onChange={(e) => setTType(e.target.value)}>
                <option value="bazar">Artículo de bazar</option>
                <option value="document">Apunte digital</option>
                <option value="user">Usuario</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              ID objetivo
              <input className="input" value={tId} onChange={(e) => setTId(e.target.value)} placeholder="ID del ítem o usuario" required minLength={1} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
            Motivo (mín. 10 caracteres)
            <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required minLength={10} maxLength={2000} placeholder="Describe la devolución o el problema…" />
          </label>
          {repMsg && <p className="text-xs font-semibold text-slate-600">{repMsg}</p>}
          <button disabled={repBusy} type="submit" className="btn-primary w-fit text-sm disabled:opacity-50">
            {repBusy ? "Enviando…" : "Enviar reporte"}
          </button>
        </form>
      </section>
    </main>
  );
}
