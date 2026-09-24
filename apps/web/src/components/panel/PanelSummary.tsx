import { Link } from "react-router-dom";
import { pen, type HubUser } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import { ROUTES } from "../../lib/routes";
import { roleLabel } from "../../lib/roles";
import type { PanelData } from "./usePanelData";

// Saludo, acciones principales y métricas reales del usuario.
export function PanelSummary({ user, d }: { user: HubUser; d: PanelData }) {
  const name = user.profile?.fullName?.trim() || user.email;
  const metrics = [
    { label: "Pedidos", icon: "shopping_bag", value: d.loading ? "…" : String(d.list.length), sub: `${d.digital} digitales · ${d.physical} físicos` },
    { label: "En custodia", icon: "lock", value: pen(d.escrowSum), sub: `${d.escrowCount} pedidos esperan tu confirmación` },
    { label: "Publicaciones activas", icon: "storefront", value: String(d.pubsActive), sub: `${d.pubDocs} apuntes · ${d.pubBazar} bazar` },
    { label: "Ventas cobradas", icon: "payments", value: pen(d.releasedNet), sub: `${d.releasedCount} pedidos liberados` },
  ];
  return (
    <>
      <section className="card flex flex-col justify-between gap-5 p-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <span className="price flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-primary text-2xl text-primary-ink">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="h-display text-2xl sm:text-3xl">¡Hola, {name.split(" ")[0]}!</h1>
              <span className="tag">{roleLabel(user.role)}</span>
              {user.profile?.cycle && <span className="tag">Ciclo {user.profile.cycle}</span>}
            </div>
            <p className="mt-1 truncate text-sm text-zinc-600">
              {user.profile?.career ? careerLabel(user.profile.career) : "Universo Agustino"} · {user.email}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={ROUTES.myBazar} className="btn btn-secondary">
            <span className="material-symbols-outlined text-lg">storefront</span> Mis publicaciones
          </Link>
          <Link to={ROUTES.publish} className="btn btn-primary">
            <span className="material-symbols-outlined text-lg">add_circle</span> Publicar material
          </Link>
        </div>
      </section>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="card flex flex-col gap-2 p-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-bold text-zinc-600">{m.label}</dt>
              <span className="material-symbols-outlined text-xl text-primary">{m.icon}</span>
            </div>
            <dd className="price text-3xl text-zinc-950">{m.value}</dd>
            <p className="text-xs text-zinc-500">{m.sub}</p>
          </div>
        ))}
      </dl>
    </>
  );
}
