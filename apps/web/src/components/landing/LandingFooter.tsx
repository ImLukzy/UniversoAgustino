import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { useAuthModal } from "../AuthModalHost";
import { Reveal } from "./Reveal";

const COLUMNS = [
  {
    title: "Plataforma",
    links: [{ label: "Sobre nosotros", to: ROUTES.legal }, { label: "Bazar", to: ROUTES.bazar }, { label: "Monetiza", to: ROUTES.monetiza }, { label: "Comunidad", to: ROUTES.explore }],
  },
  {
    title: "Facultades",
    links: [{ label: "Ingenierías", to: "/#carreras" }, { label: "Biomédicas", to: "/#carreras" }, { label: "Sociales", to: "/#carreras" }],
  },
  {
    title: "Ayuda y Legal",
    links: [{ label: "Términos", to: ROUTES.legal }, { label: "Privacidad", to: ROUTES.legal }, { label: "Escrow", to: ROUTES.legal }, { label: "Contacto", to: ROUTES.legal }],
  },
];

// Iconos de marca como SVG inline (Material Symbols no incluye logos).
const SOCIAL = [
  { label: "Instagram", d: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.5-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" },
  { label: "Facebook", d: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8Z" },
  { label: "TikTok", d: "M16 3c.4 2.3 1.9 3.8 4 4v3.5a7.6 7.6 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3.6a2.5 2.5 0 1 0 2.5 2.4V3H16Z" },
];

export function LandingFooter() {
  const { openAuth } = useAuthModal();
  return (
    <footer className="bg-white">
      <div className="bg-[#3b5a5c]">
        <Reveal className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.5rem]">¡Estudiamos juntos, crecemos juntos!</h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/85">Crea tu cuenta con tu correo @unsa.edu.pe y empieza a estudiar mejor hoy.</p>
          <button type="button" onClick={openAuth} className="btn btn-lg mt-8 bg-[#e3f98b]">
            Crear cuenta gratis
          </button>
        </Reveal>
      </div>

      <div className="bg-[#28132c] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="font-bold">{c.title}</p>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-white/70 hover:text-white hover:underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-bold">Síguenos</p>
            <div className="mt-4 flex gap-2">
              {SOCIAL.map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" fillRule="evenodd" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-white/60 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo-ua.svg" alt="" width={24} height={24} className="h-6 w-6" />
              <span>© 2026 Universo Agustino</span>
            </div>
            <label className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span className="sr-only">Idioma y sede</span>
              <select defaultValue="aqp" className="bg-transparent text-white/80 outline-none">
                <option value="aqp" className="text-zinc-900">Español · Arequipa</option>
              </select>
            </label>
            <p className="max-w-sm text-center md:text-right">Iniciativa estudiantil independiente; no afiliada oficialmente a la UNSA.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
