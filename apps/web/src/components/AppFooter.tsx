import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";
import { useAuthModal } from "./AuthModalHost";
import { UNSA_CAREERS } from "../data/unsa";

// Pie global de la app: solo rutas reales. Las carreras abren /explorar con
// ?career= (filtra el catálogo y aplica el color de la escuela).
const COLS: { h: string; links: { l: string; to?: string; auth?: boolean }[] }[] = [
  { h: "Catálogo", links: [{ l: "Explorar", to: ROUTES.explore }, { l: "Bazar", to: ROUTES.bazar }, { l: "Publicar", to: ROUTES.publish }, { l: "Monetiza", to: ROUTES.monetiza }] },
  { h: "Cuenta", links: [{ l: "Iniciar sesión", auth: true }, { l: "Crear cuenta", to: ROUTES.register }, { l: "Mis pedidos", to: ROUTES.myOrders }, { l: "Mis ventas", to: ROUTES.mySales }] },
  { h: "Carreras", links: UNSA_CAREERS.slice(0, 4).map((c) => ({ l: c.label, to: `${ROUTES.explore}?career=${c.key}` })) },
  { h: "Ayuda y legal", links: [{ l: "Marco legal D.L. 822", to: ROUTES.legal }, { l: "Mis publicaciones", to: ROUTES.myBazar }, { l: "Mi cuenta", to: ROUTES.account }, { l: "Panel", to: ROUTES.panel }] },
];

export function AppFooter() {
  const { openAuth } = useAuthModal();
  const link = "w-fit text-sm text-zinc-600 transition-colors hover:text-zinc-950 hover:underline";
  return (
    <footer className="w-full border-t-2 border-zinc-900 bg-[rgb(var(--ua-paper))] py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-2 md:col-span-3 lg:col-span-1">
          <span className="flex items-center gap-2">
            <img src="/logo-ua.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="font-display font-extrabold tracking-tight text-zinc-950">Universo Agustino</span>
          </span>
          <p className="text-sm leading-relaxed text-zinc-600">Apuntes y bazar de la comunidad estudiantil de la UNSA, Arequipa.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.h} aria-label={c.h} className="flex flex-col gap-2">
            <span className="eyebrow text-zinc-900">{c.h}</span>
            {c.links.map((l) =>
              l.auth ? (
                <button key={l.l} type="button" onClick={openAuth} className={`${link} text-left`}>{l.l}</button>
              ) : (
                <Link key={l.l} to={l.to ?? ROUTES.home} className={link}>{l.l}</Link>
              ),
            )}
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-1 border-t border-dashed border-zinc-300 px-4 pt-4 text-xs text-zinc-500">
        <span>© 2026 Universo Agustino · Iniciativa estudiantil independiente, no afiliada oficialmente a la UNSA.</span>
      </div>
    </footer>
  );
}
