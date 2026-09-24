import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { SPRING } from "../lib/motion";
import { ROUTES } from "../lib/routes";
import { prefetchRoute } from "../lib/prefetch";

const SECTIONS: { title?: string; links: { to: string; icon: string; label: string }[] }[] = [
  {
    links: [
      { to: ROUTES.appHome, icon: "home", label: "Inicio" },
      { to: ROUTES.explore, icon: "explore", label: "Explorar" },
      { to: ROUTES.balotarios, icon: "quiz", label: "Balotarios" },
      { to: ROUTES.bazar, icon: "storefront", label: "Bazar" },
    ],
  },
  {
    title: "Mi espacio",
    links: [
      { to: ROUTES.panel, icon: "dashboard", label: "Panel" },
      { to: ROUTES.myOrders, icon: "receipt_long", label: "Mis pedidos" },
      { to: ROUTES.myBazar, icon: "menu_book", label: "Mis publicaciones" },
      { to: ROUTES.mySales, icon: "point_of_sale", label: "Mis ventas" },
    ],
  },
  {
    title: "Comunidad",
    links: [
      { to: ROUTES.monetiza, icon: "payments", label: "Monetiza" },
      { to: ROUTES.legal, icon: "gavel", label: "Marco legal" },
    ],
  },
];

// Navegación principal (sidebar fijo y drawer móvil). Solo rutas reales.
// `animateActive` desactiva el pill compartido en el drawer: dos layoutId
// iguales montados a la vez romperían la animación.
export function AppSidebar({ onAction, animateActive = true }: { onAction?: () => void; animateActive?: boolean }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-col gap-1" aria-label="Secciones">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Link to={ROUTES.publish} onClick={onAction} className="btn btn-primary btn-sm">
          <span className="material-symbols-outlined text-base">add</span> Publicar
        </Link>
        <Link to={ROUTES.subirMaterial} onClick={onAction} className="btn btn-secondary btn-sm">
          <span className="material-symbols-outlined text-base">cloud_upload</span> Subir
        </Link>
      </div>
      {SECTIONS.map((s, i) => (
        <div key={s.title ?? i} className="flex flex-col gap-0.5 pb-2">
          {s.title && <p className="eyebrow px-3 pb-1 pt-3">{s.title}</p>}
          {s.links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={onAction}
                onMouseEnter={() => prefetchRoute(l.to)}
                onFocus={() => prefetchRoute(l.to)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm transition-colors ${active ? "font-extrabold text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"} ${active && !animateActive ? "bg-primary-soft" : ""}`}
              >
                {active && animateActive && <motion.span layoutId="appSideActive" transition={SPRING} className="absolute inset-0 rounded-xl border-2 border-zinc-900 bg-primary-soft" aria-hidden="true" />}
                <span className="material-symbols-outlined relative text-xl">{l.icon}</span>
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
