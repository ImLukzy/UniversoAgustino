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

const ACTIVE_CLS =
  "px-space-md py-space-sm transition-all bg-surface-container-high text-primary font-semibold rounded-lg";
const IDLE_CLS =
  "px-space-md py-space-sm rounded-lg text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all";

// Barra superior principal (la misma en marketplace, bazar, monetiza, legal y
// páginas de cuenta). El selector de carrera está controlado por el tema
// global, así tu carrera queda marcada acá y en toda la página.
export function StitchHeader({ active }: { active: StitchSection }) {
  const { career, setCareer, accent } = useCareerTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-[90rem] mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <a className="flex items-center gap-space-sm group" data-path="explorar-marketplace" href="#">
            <img
              alt="Universo Agustino"
              className="h-10 w-auto object-contain"
              src="/logo-ua.svg"
            />
            <div className="flex flex-col">
              <span
                style={accent ? { color: accent.color } : undefined}
                className="font-headline-sm text-headline-sm text-primary tracking-tight"
              >
                Universo <span className="text-secondary font-headline-sm text-headline-sm">Agustino</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Conectamos estudiantes, multiplicamos oportunidades
              </span>
            </div>
          </a>
        </div>
        <nav
          className="hidden xl:flex items-center gap-space-xs"
          data-active-classes="bg-surface-container-high text-primary font-semibold rounded-lg"
        >
          {NAV.map((n) =>
            active === n.key ? (
              <a
                key={n.path}
                style={accent ? { backgroundColor: accent.soft, color: accent.color } : undefined}
                aria-current="page"
                className={ACTIVE_CLS}
                data-path={n.path}
                href="#"
              >
                {n.label}
              </a>
            ) : (
              <a key={n.path} className={IDLE_CLS} data-path={n.path} href="#">
                {n.label}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-space-sm">
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs bg-surface-container-low rounded-full">
            <span className="material-symbols-outlined text-tertiary text-title-md">verified</span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold">
              Yape / Plin Verificado
            </span>
          </div>
          <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-space-sm py-space-xxs">
            <span className="material-symbols-outlined text-outline text-title-md mr-space-xxs">
              school
            </span>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              aria-label="Carrera UNSA"
              className="bg-transparent font-label-sm text-label-sm text-on-surface font-semibold focus:outline-none cursor-pointer pr-space-xs"
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
  );
}
