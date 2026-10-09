import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SuspensionBanner } from "../components/SuspensionBanner";
import { PanelSidebar } from "../components/teamPanel/PanelSidebar";
import { PanelDrawer } from "../components/teamPanel/PanelDrawer";
import { PanelTopBar } from "../components/teamPanel/PanelTopBar";
import { PanelSection } from "../components/teamPanel/PanelSection";
import { panelPath, visibleSections } from "../components/teamPanel/navigation";
export function TeamPanel() {
  const { user, loading } = useAuth(), { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const content = useRef<HTMLElement>(null), sidebar = useRef<HTMLElement>(null);
  const sections = visibleSections(user?.role), slug = pathname.slice("/panel/".length);
  const section = sections.find((s) => s.slug === slug);
  useEffect(() => {
    close(); content.current?.scrollTo({ top: 0 });
  }, [pathname, close]);
  useEffect(() => {
    const main = content.current, menu = sidebar.current;
    if (main) main.inert = open;
    if (menu) menu.inert = open;
    return () => { if (main) main.inert = false; if (menu) menu.inert = false; };
  }, [open]);
  if (loading) return <main className="flex min-h-screen items-center justify-center"><p role="status">Cargando panel…</p></main>;
  if (sections.length === 0) return <Navigate to="/actividad" replace />;
  if (pathname === "/panel" || pathname === "/panel/") return <Navigate to={panelPath("resumen")} replace />;
  // Keep this route unavailable to workers while returning them to a useful section.
  if (slug === "miembros" && user?.role !== "admin") return <Navigate to={panelPath("resumen")} replace />;
  if (!section) return <main className="mx-auto max-w-xl px-4 py-16"><h1 className="h-display text-2xl">Sección no disponible</h1><Link to={panelPath("resumen")} className="btn btn-secondary mt-4">Volver al resumen</Link></main>;
  return <div className="flex h-dvh w-full overflow-hidden bg-zinc-50">
    <a href="#panel-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-white focus:p-3">Ir al contenido</a>
    <aside ref={sidebar} className="hidden h-full w-72 shrink-0 border-r border-zinc-200 bg-white p-4 lg:block" aria-label="Navegación del equipo"><PanelSidebar /></aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <PanelTopBar title={section.label} open={open} onOpen={() => setOpen(true)} />
      <main id="panel-content" ref={content} tabIndex={0} aria-label="Contenido del panel" className="min-h-0 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className="mx-auto flex min-w-0 max-w-6xl flex-col gap-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8">
          <header className="flex min-w-0 flex-col gap-1"><p className="eyebrow">{section.group}</p>
            <h1 className="h-display sr-only break-words text-3xl lg:not-sr-only">{section.label}</h1>
            <p className="max-w-prose text-sm text-zinc-600">{section.description}</p></header>
          <SuspensionBanner /><PanelSection key={section.slug} slug={section.slug} />
        </div>
      </main>
    </div>
    {open && <PanelDrawer close={close} />}
  </div>;
}
