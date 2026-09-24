import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../lib/motion";
import { AppSidebar } from "./AppSidebar";
import { ProfileMenu } from "./ProfileMenu";
import { AppFooter } from "./AppFooter";
import { useAuth } from "../auth/AuthContext";
import { useAuthModal } from "./AuthModalHost";
import { ROUTES } from "../lib/routes";

function Logo() {
  return (
    <Link to={ROUTES.home} className="mb-4 flex items-center gap-2 px-1" aria-label="Universo Agustino, inicio">
      <img alt="" src="/logo-ua.svg" width={36} height={36} className="h-9 w-9" />
      <span className="font-display text-base font-extrabold tracking-tight text-zinc-950">Universo Agustino</span>
    </Link>
  );
}

// Layout de la app: sidebar fijo (lg) o drawer (móvil) + header con buscador
// global que lleva a /explorar?q= + sesión. Solo rutas reales.
export function AppLayout({ children, fluid }: { children: ReactNode; fluid?: boolean }) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");

  const search = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    nav(term ? `${ROUTES.explore}?q=${encodeURIComponent(term)}` : ROUTES.explore);
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r-2 border-zinc-900 bg-[rgb(var(--ua-paper))] p-4 lg:flex" aria-label="Navegación principal">
        <Logo />
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <button type="button" onClick={() => setDrawer(true)} aria-label="Abrir menú" className="btn-ghost h-11 w-11 shrink-0 px-0 lg:hidden">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <form role="search" onSubmit={search} className="searchbar mx-auto h-11 min-w-0 max-w-2xl">
            <span className="material-symbols-outlined text-zinc-500" aria-hidden="true">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar apuntes, cursos o artículos" aria-label="Buscar en el catálogo" />
          </form>
          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <ProfileMenu />
            ) : (
              <button type="button" onClick={openAuth} className="btn btn-primary btn-sm">Iniciar sesión</button>
            )}
          </div>
        </header>
        <main className={fluid ? "w-full flex-1" : "mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-10"}>{children}</main>
        <AppFooter />
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div key="app-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setDrawer(false)} aria-hidden="true" className="fixed inset-0 z-[70] bg-zinc-900/50 lg:hidden" />
            <motion.aside
              key="app-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menú principal"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={SPRING}
              className="fixed left-0 top-0 z-[71] flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r-2 border-zinc-900 bg-[rgb(var(--ua-paper))] p-4 lg:hidden"
            >
              <Logo />
              <AppSidebar onAction={() => setDrawer(false)} animateActive={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
