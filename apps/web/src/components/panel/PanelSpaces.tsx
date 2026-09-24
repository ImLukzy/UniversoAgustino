import { Link } from "react-router-dom";
import { pen } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import type { PanelData } from "./usePanelData";

// Accesos a cada módulo del usuario con su contador real.
export function PanelSpaces({ d, email }: { d: PanelData; email: string }) {
  const spaces = [
    { to: ROUTES.explore, icon: "explore", title: "Explorar catálogo", desc: "Apuntes y bazar de tu ciclo.", foot: "Catálogo UNSA" },
    { to: ROUTES.myOrders, icon: "receipt_long", title: "Mis pedidos", desc: "Custodia y entregas de tus compras.", foot: `${d.live} en curso` },
    { to: ROUTES.myBazar, icon: "store", title: "Mis publicaciones", desc: "Precios, QR de cobro y ventas.", foot: d.releasedNet > 0 ? `${pen(d.releasedNet)} generados` : `${d.pubsActive} activas` },
    { to: ROUTES.mySales, icon: "point_of_sale", title: "Gestión de ventas", desc: "Alquileres, ventas y reportes.", foot: `${d.salesPending} pendientes` },
    { to: ROUTES.account, icon: "person", title: "Mi cuenta", desc: email, foot: "Perfil y carrera" },
    ...(d.isMod ? [{ to: ROUTES.admin, icon: "gavel", title: "Moderación", desc: "Reportes D.L. 822 (< 48 h).", foot: `${d.openReports} por resolver` }] : []),
  ];
  return (
    <section className="flex flex-col gap-4">
      <h2 className="h-display text-2xl">Mi espacio</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((s) => (
          <Link key={s.to} to={s.to} className="card card-hover group flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary-soft text-primary">{s.icon}</span>
              <span className="material-symbols-outlined text-zinc-500 transition-transform group-hover:translate-x-1">arrow_forward</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-zinc-950">{s.title}</h3>
              <p className="truncate text-sm text-zinc-600" title={s.desc}>{s.desc}</p>
            </div>
            <p className="border-t border-dashed border-zinc-300 pt-2 text-xs font-bold text-zinc-700">{s.foot}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
