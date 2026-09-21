import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, pen, type HubBazarItem, type HubDocument, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
import { careerLabel } from "../data/unsa";
import { PanelOrderRow } from "../components/PanelOrderRow";
import { ListRowSkeleton } from "../components/Skeleton";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderador",
  creator: "Creador",
  student: "Estudiante",
};

export function Panel() {
  const { user } = useAuth();
  const { career, accent } = useCareerTheme();
  const cc = careerContent(career);
  const nav = useNavigate();
  const [filter, setFilter] = useState<"all" | "escrow" | "digital" | "bazar">("all");

  const orders = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get("/orders/mine")).data.data as HubOrder[],
    enabled: !!user,
  });
  const docs = useQuery({
    queryKey: ["docs-mine"],
    queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[],
    enabled: !!user,
  });
  const bazar = useQuery({
    queryKey: ["bazar-mine"],
    queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[],
    enabled: !!user,
  });
  const sales = useQuery({
    queryKey: ["orders", "sales"],
    queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[],
    enabled: !!user,
  });
  const isMod = user?.role === "admin" || user?.role === "moderator";
  const reports = useQuery({
    queryKey: ["reports", "open"],
    queryFn: async () => (await api.get("/reports")).data.data as Array<{ status: string }>,
    enabled: !!user && isMod,
    retry: false,
  });
  const mineReports = useQuery({
    queryKey: ["reports", "mine"],
    queryFn: async () => (await api.get("/reports/mine")).data.data as Array<{ status: string }>,
    enabled: !!user,
    retry: false,
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para ver tu panel.
        </div>
      </main>
    );
  }

  const name = user.profile?.fullName?.trim() || user.email;
  const first = name.split(" ")[0];
  const initial = name.charAt(0).toUpperCase();
  const list = orders.data ?? [];
  const myDocs = docs.data ?? [];
  const myBazar = bazar.data ?? [];
  const mySales = sales.data ?? [];
  const escrowOrders = list.filter((o) => o.status === "ESCROW");
  const escrowSum = escrowOrders.reduce((a, o) => a + o.amountCents, 0);
  const digitalCount = list.filter((o) => o.itemType === "document").length;
  const fisicCount = list.filter((o) => o.itemType === "bazar").length;
  const pubsActive = myDocs.filter((d) => d.status === "PUBLISHED").length + myBazar.filter((b) => b.status === "AVAILABLE").length;
  const releasedNet = mySales.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0);
  const pendingRentals = mySales.filter((o) => o.itemType === "bazar" && o.status === "PENDING").length;
  const openMine = (mineReports.data ?? []).filter((r) => r.status === "OPEN").length;
  const ventasPending = pendingRentals + openMine;
  const openReports = (reports.data ?? []).filter((r) => r.status === "OPEN").length;
  const filtered = list.filter((o) => {
    if (filter === "escrow") return o.status === "ESCROW";
    if (filter === "digital") return o.itemType === "document";
    if (filter === "bazar") return o.itemType === "bazar";
    return true;
  });

  const spaces = [
    { to: "/pedidos", icon: "receipt_long", title: "Mis pedidos", desc: "Custodia y entregas de tus compras.", foot: `${list.filter((o) => ["PENDING", "ACCEPTED", "PAID", "ESCROW"].includes(o.status)).length} en curso`, footCls: "text-emerald-700", tail: "Ver historial" },
    { to: "/publicaciones", icon: "store", title: "Mi Bazar", desc: "Precios, QR de cobro y ventas.", foot: `${pubsActive} activas`, footCls: "text-primary", tail: releasedNet > 0 ? `${pen(releasedNet)} gen.` : "Vender" },
    { to: "/cuenta", icon: "person", title: "Mi cuenta", desc: user.email, foot: "Carnet UNSA", footCls: "text-indigo-700", tail: "Ajustes" },
    { to: "/ventas", icon: "point_of_sale", title: "Gestión de Ventas", desc: "Alquileres, ventas digitales y reportes.", foot: `${ventasPending} pendientes`, footCls: "text-red-600", tail: "Gestionar" },
    ...(isMod
      ? [{ to: "/admin", icon: "verified_user", title: "Moderación", desc: "Reportes y takedowns D.L. 822.", foot: `${openReports} por resolver`, footCls: "text-red-600", tail: "Auditar" }]
      : []),
  ];

  const metrics: Array<{
    label: string; icon: string; iconWrap: string; main: string;
    mainCls?: string; badge?: string; link?: string; linkLabel?: string; sub: string;
  }> = [
    {
      label: "Total Pedidos", icon: "shopping_bag", iconWrap: "bg-primary/10 text-primary",
      main: orders.isLoading ? "…" : String(list.length),
      sub: `${digitalCount} digitales · ${fisicCount} físicos`,
    },
    {
      label: "En Custodia (Escrow)", icon: "lock", iconWrap: "bg-indigo-100 text-indigo-800",
      main: pen(escrowSum), mainCls: "text-primary",
      badge: `${escrowOrders.length} Activos`,
      sub: "Dinero retenido hasta tu confirmación",
    },
    {
      label: "Publicaciones Activas", icon: "storefront", iconWrap: "bg-slate-200 text-slate-700",
      main: String(pubsActive), link: "/publicaciones", linkLabel: "Gestionar →",
      sub: `${myDocs.filter((d) => d.status === "PUBLISHED").length} apuntes · ${myBazar.filter((b) => b.status === "AVAILABLE").length} bazar`,
    },
    {
      label: "Ventas cobradas", icon: "payments", iconWrap: "bg-emerald-50 text-emerald-700",
      main: pen(releasedNet), mainCls: "text-emerald-700",
      sub: `${mySales.filter((o) => o.status === "RELEASED").length} pedidos liberados`,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Bienvenida */}
      <section className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl bg-white p-5 shadow-sm xl:flex-row xl:items-center">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="z-10 flex items-start gap-3 sm:items-center">
          <div className="relative shrink-0">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl text-white shadow-inner"
              style={{ backgroundColor: accent?.color ?? "rgb(var(--hub-p, 0 104 95))" }}
            >
              {initial}
            </div>
            {(user.role === "admin" || user.role === "moderator") && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm" title="Verificado">
                <span className="material-symbols-outlined text-sm">verified</span>
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="font-display text-2xl tracking-tight">¡Hola, {first}!</h1>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary" style={accent ? { color: accent.color } : undefined}>
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
              {user.profile?.cycle && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{user.profile.cycle} Ciclo</span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                <span className="material-symbols-outlined text-base text-primary" style={accent ? { color: accent.color } : undefined}>school</span>
                {user.profile?.career ? careerLabel(user.profile.career) : "Universo Agustino"}
              </span>
              <span>•</span>
              <span className="font-mono text-xs text-slate-400">{user.email}</span>
            </p>
          </div>
        </div>
        <div className="z-10 flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <Link to="/publicaciones" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm text-slate-800 transition-all hover:bg-slate-200 sm:flex-initial">
            <span className="material-symbols-outlined text-lg text-primary" style={accent ? { color: accent.color } : undefined}>storefront</span>
            <span className="font-medium">Mi Bazar</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 font-bold text-primary" style={accent ? { color: accent.color } : undefined}>{pubsActive}</span>
          </Link>
          <button
            onClick={() => nav("/publicar")}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm text-white shadow-sm transition-all hover:brightness-110 active:scale-95 sm:flex-initial"
            style={accent ? { backgroundColor: accent.color } : undefined}
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Publicar material</span>
          </button>
        </div>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{m.label}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${m.iconWrap}`}>
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className={`font-display text-3xl leading-none ${m.mainCls ?? ""}`}>{m.main}</div>
              {m.badge ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">{m.badge}</span>
              ) : m.link ? (
                <Link to={m.link} className="text-xs font-semibold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>{m.linkLabel}</Link>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-slate-500">{m.sub}</div>
          </div>
        ))}
      </section>

      {/* Banners */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-xl p-5 text-white shadow-md"
          style={{ background: accent ? `linear-gradient(135deg, ${accent.soft}, ${accent.color})` : undefined }}
        >
          <div className="pointer-events-none absolute -bottom-4 right-0 translate-x-4 opacity-20">
            <span className="material-symbols-outlined text-[130px]">explore</span>
          </div>
          <div className="z-10">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-white/90">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span> Catálogo estudiantil
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">Explorar Marketplace</h2>
            <p className="mt-1 max-w-xs text-xs text-white/85">Apuntes originales y bazar de tu ciclo académico.</p>
          </div>
          <div className="z-10 mt-3">
            <Link to="/" className="inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-xs font-bold text-primary shadow transition-all hover:shadow-md" style={accent ? { color: accent.color } : undefined}>
              <span>Ir al catálogo</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-xl bg-slate-900 p-5 text-white shadow-md">
          <div className="pointer-events-none absolute -bottom-4 right-0 translate-x-4 opacity-15">
            <span className="material-symbols-outlined text-[130px]">receipt_long</span>
          </div>
          <div className="z-10">
            <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              <span className="material-symbols-outlined text-sm">lock_clock</span> Seguridad escrow
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight">Mis Pedidos y Entregas</h2>
            <p className="mt-1 max-w-xs text-xs text-slate-300">Pagos en custodia y descargas con sello de agua.</p>
          </div>
          <div className="z-10 mt-3">
            <Link to="/pedidos" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition-all hover:bg-white/20">
              <span>Ver pedidos en curso ({list.filter((o) => ["PENDING", "ACCEPTED", "PAID", "ESCROW"].includes(o.status)).length})</span>
              <span className="material-symbols-outlined text-sm">north_east</span>
            </Link>
          </div>
        </div>

        {isMod ? (
          <Link to="/admin" className="flex min-h-[170px] flex-col justify-between rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md md:col-span-2 xl:col-span-1">
            <div className="z-10">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                  <span className="material-symbols-outlined text-sm">gavel</span> Moderación · D.L. 822
                </span>
                <span className="animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                  {openReports} pendientes
                </span>
              </div>
              <h2 className="font-display text-xl font-extrabold tracking-tight">Reportes de propiedad intelectual</h2>
              <p className="mt-1 text-xs text-slate-500">Auditoría de apuntes reportados. Tu Gestión de Ventas está en /ventas.</p>
            </div>
            <div className="z-10 mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                <span>Abrir cola de moderación</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">SLA &lt; 48h</span>
            </div>
          </Link>
        ) : (
          <Link to="/publicar" className="flex min-h-[170px] flex-col justify-between rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md md:col-span-2 xl:col-span-1">
            <div className="z-10">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                  <span className="material-symbols-outlined text-sm">payments</span> Monetiza tus apuntes
                </span>
              </div>
              <h2 className="font-display text-xl font-extrabold tracking-tight">Vende y cobra por Yape</h2>
              <p className="mt-1 text-xs text-slate-500">Publica en minutos con tu QR de cobro configurado.</p>
            </div>
            <div className="z-10 mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">
                <span>Publicar ahora</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
          </Link>
        )}
      </section>

      {/* Mi espacio */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1 font-display text-lg font-extrabold tracking-tight">
            <span className="material-symbols-outlined text-primary" style={accent ? { color: accent.color } : undefined}>widgets</span>
            Mi Espacio
          </h2>
          <span className="text-xs text-slate-500">{spaces.length} módulos activos</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {spaces.map((s) => (
            <Link key={s.to} to={s.to} className="group flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-primary group-hover:text-white">
                  <span className="material-symbols-outlined text-xl">{s.icon}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 transition-colors group-hover:text-primary">arrow_forward</span>
              </div>
              <div className="mt-3">
                <h3 className="font-bold transition-colors group-hover:text-primary">{s.title}</h3>
                <p className="mt-0.5 truncate text-xs text-slate-500" title={s.desc}>{s.desc}</p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                <span className={`text-xs font-semibold ${s.footCls}`}>{s.foot}</span>
                <span className="text-xs text-slate-400">{s.tail}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Últimos pedidos con filtros */}
      <section className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-extrabold tracking-tight">Últimos pedidos</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{list.length} registros</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Compras digitales, bazar en custodia y descargas autenticadas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {([["all", "Todos"], ["escrow", "En custodia"], ["digital", "Digitales"], ["bazar", "Bazar"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`rounded-md px-2 py-1 text-xs font-semibold transition-all ${filter === v ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  style={filter === v && accent ? { color: accent.color } : undefined}
                >
                  {l}
                </button>
              ))}
            </div>
            <Link to="/pedidos" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>
              <span>Ver todos</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {orders.isLoading && <ListRowSkeleton count={6} />}
          {!orders.isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 px-4 py-10 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300">inbox</span>
              <p className="mt-2 text-sm text-slate-400">{list.length === 0 ? "Aún no tienes pedidos" : "Nada en este filtro"}</p>
              {list.length === 0 && (
                <Link to="/" className="text-sm font-bold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>
                  Compra tu primer apunte →
                </Link>
              )}
            </div>
          )}
          {filtered.slice(0, 6).map((o) => <PanelOrderRow key={o.id} order={o} />)}
        </div>

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
      </section>

      {/* Entrega + cuenta */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cómo cobras</span>
            <div className="mt-2 text-2xl font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>
              {paySummary(myDocs, myBazar)}
            </div>
            <p className="mt-1 text-xs text-slate-500">Métodos configurados en tus publicaciones</p>
          </div>
          <Link to="/publicaciones" className="btn-primary text-center text-sm">Configurar cobro</Link>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Puntos de entrega</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">Arequipa</span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {cc.meetSpots.map((s, i) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                  <span className="flex items-center gap-1 text-xs font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-600"></span> {s}
                  </span>
                  <span className="text-[11px] text-slate-500">{cc.meetTimes[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-1 border-t border-slate-100 pt-2 text-xs font-semibold text-emerald-700">
            <span className="material-symbols-outlined text-sm">shield</span> Entrega con escrow 100%
          </p>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tu cuenta</span>
              <span className="material-symbols-outlined text-emerald-600">health_and_safety</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span> {user.email}
              </p>
              <p className="flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span> Rol {ROLE_LABEL[user.role] ?? user.role} · D.L. 822
              </p>
              <p className="flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-lg text-emerald-600">check_circle</span>
                {user.profile?.career ? careerLabel(user.profile.career) : "Universo Agustino"}
              </p>
            </div>
          </div>
          <Link to="/cuenta" className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-bold transition-all hover:bg-slate-200">
            Ir a Mi cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}

function paySummary(docs: HubDocument[], bazar: HubBazarItem[]) {
  const methods = new Set<string>();
  [...docs, ...bazar].forEach((i) => {
    const m = (i as { payMethod?: string | null }).payMethod ?? "YAPE";
    if (m === "AMBAS") {
      methods.add("Yape");
      methods.add("Plin");
    } else if (m === "PLIN") methods.add("Plin");
    else methods.add("Yape");
  });
  if (methods.size === 0) return "Sin configurar";
  return [...methods].join(" / ");
}
