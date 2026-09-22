import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UNSA_CAREERS } from "../data/unsa";
import { useCareerTheme } from "../live/careerTheme";
import { StitchAuth } from "../live/StitchAuth";

export type StitchSection = "marketplace" | "bazar" | "monetiza" | "legal" | null;

const NAV: Array<{ key: Exclude<StitchSection, null>; path: string; label: string }> = [
  { key: "marketplace", path: "explorar-marketplace", label: "Explorar Marketplace" },
  { key: "bazar", path: "bazar-y-alquiler", label: "Bazar & Alquiler" },
  { key: "monetiza", path: "vender-y-monetizar", label: "Vender & Monetizar" },
  { key: "legal", path: "marco-legal-y-etica-academica", label: "Marco Legal & Ética" },
];

// Barra superior principal (la misma en marketplace, bazar, monetiza, legal y
// páginas de cuenta). El selector de carrera está controlado por el tema
// global, así tu carrera queda marcada acá y en toda la página.
// Craftsmanship: al hacer scroll el header pasa a bg-white/80 +
// backdrop-blur-md con borde inferior sutil; el enlace activo usa
// layoutId="activeNavTab" (el drawer móvil usa resaltado estático para no
// duplicar el layoutId mientras ambos están montados).
export function StitchHeader({ active }: { active: StitchSection }) {
  const { career, setCareer, accent } = useCareerTheme();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer ]);

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "border-b border-slate-200/80 bg-white/80 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur-md"
            : "border-b border-transparent bg-surface-container-lowest/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between gap-space-md px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Abrir menú"
              aria-expanded={drawer}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-container xl:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <a className="group flex items-center gap-space-sm" data-path="explorar-marketplace" href="#">
              <img
                alt="Universo Agustino"
                width="50"
                height="40"
                className="h-10 w-auto object-contain"
                src="/logo-ua.svg"
              />
              <div className="flex flex-col">
                <span
                  style={accent ? { color: accent.color } : undefined}
                  className="font-headline-sm text-headline-sm tracking-tight text-primary"
                >
                  Universo <span className="font-headline-sm text-headline-sm text-secondary">Agustino</span>
                </span>
                <span className="hidden font-label-sm text-label-sm font-medium text-on-surface-variant sm:block">
                  Conectamos estudiantes, multiplicamos oportunidades
                </span>
              </div>
            </a>
          </div>
          <nav
            className="hidden items-center gap-space-xs xl:flex"
            data-active-classes="bg-surface-container-high text-primary font-semibold rounded-lg"
          >
            {NAV.map((n) => {
              const isActive = active === n.key;
              return (
                <a
                  key={n.path}
                  data-path={n.path}
                  href="#"
                  aria-current={isActive ? "page" : undefined}
                  style={isActive && accent ? { color: accent.color } : undefined}
                  className={`relative rounded-lg px-space-md py-space-sm font-label-lg text-label-lg transition-colors ${
                    isActive ? "font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavTab"
                      transition={{ type: "spring", stiffness: 350, damping: 32 }}
                      className="absolute inset-0 rounded-lg"
                      style={{ backgroundColor: accent?.soft ?? "#ccfbf1" }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{n.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="flex items-center gap-space-sm">
            <div className="hidden items-center gap-space-xs rounded-full bg-surface-container-low px-space-sm py-space-xs sm:flex">
              <span className="material-symbols-outlined text-tertiary text-title-md">verified</span>
              <span className="font-label-sm text-label-sm font-semibold text-tertiary">
                Yape / Plin Verificado
              </span>
            </div>
            <div className="hidden items-center rounded-full bg-surface-container-low px-space-sm py-space-xxs lg:flex">
              <span className="material-symbols-outlined text-outline text-title-md mr-space-xxs">
                school
              </span>
              <select
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                aria-label="Carrera UNSA"
                className="cursor-pointer bg-transparent py-2 pl-1 pr-space-xs font-label-sm text-label-sm font-semibold text-on-surface focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="all">Todas las carreras</option>
                {UNSA_CAREERS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <StitchAuth />
          </div>
        </div>
      </header>

      {/* Drawer móvil: overlay con fade + panel lateral con spring */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawer(false)}
              aria-hidden="true"
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] xl:hidden"
            />
            <motion.aside
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed right-0 top-0 z-[61] flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl xl:hidden"
            >
              <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
                <span className="font-headline-sm text-headline-sm font-bold text-primary" style={accent ? { color: accent.color } : undefined}>
                  Universo Agustino
                </span>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <nav onClick={() => setDrawer(false)} aria-label="Secciones" className="flex flex-col gap-1 overflow-y-auto p-4">
                {NAV.map((n) => {
                  const isActive = active === n.key;
                  return (
                    <a
                      key={n.path}
                      data-path={n.path}
                      href="#"
                      aria-current={isActive ? "page" : undefined}
                      style={
                        isActive
                          ? { backgroundColor: accent?.soft ?? "#ccfbf1", color: accent?.color }
                          : undefined
                      }
                      className={`flex min-h-[44px] items-center rounded-lg px-3 font-label-lg text-label-lg transition-colors ${
                        isActive ? "font-semibold" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      {n.label}
                    </a>
                  );
                })}
              </nav>
              <div className="mt-auto shrink-0 border-t border-slate-200/80 p-4">
                <label className="flex min-h-[44px] items-center gap-2 rounded-lg bg-surface-container-low px-3">
                  <span className="material-symbols-outlined text-outline text-title-md">school</span>
                  <select
                    value={career}
                    onChange={(e) => {
                      setCareer(e.target.value);
                      setDrawer(false);
                    }}
                    aria-label="Carrera UNSA"
                    className="w-full cursor-pointer bg-transparent py-2 font-label-sm text-label-sm font-semibold text-on-surface focus:outline-none"
                  >
                    <option value="all">Todas las carreras</option>
                    {UNSA_CAREERS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-center text-[11px] text-slate-500">UNSA · Arequipa</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
