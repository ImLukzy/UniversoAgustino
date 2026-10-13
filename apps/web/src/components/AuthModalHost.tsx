import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { OAuthButtons, type OAuthStatus } from "./auth/OAuthButtons";
const EmailCodeLogin = lazy(() => import("./auth/EmailCodeLogin").then((module) => ({ default: module.EmailCodeLogin })));

const Modal = lazy(() => import("./ui/Modal").then((module) => ({ default: module.Modal })));

// Modal de autenticación global (sin página propia: /login y /register solo lo abren): openAuth() lo abre
// desde cualquier parte. Google/Apple o correo UNSA con código al buzón
// (spec 22): el backend exige @unsa.edu.pe y crea la cuenta en el primer
// ingreso, así que iniciar sesión y registrarse son el mismo paso.
const Ctx = createContext<{ openAuth: () => void; openRegister: () => void }>({ openAuth: () => {}, openRegister: () => {} });
export const useAuthModal = () => useContext(Ctx);

export function AuthModalHost({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OAuthStatus | null>(null);
  const statusRequested = useRef(false);

  const openAuth = useCallback(() => {
    setOpen(true);
    if (statusRequested.current) return;
    statusRequested.current = true;
    void fetch(`${API_BASE}/auth/oauth/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.data && setStatus({ google: !!j.data.google, apple: !!j.data.apple }))
      .catch(() => { statusRequested.current = false; });
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const api = useMemo(() => ({ openAuth, openRegister: openAuth }), [openAuth]);

  return (
    <Ctx.Provider value={api}>
      {children}
      {open && <Suspense fallback={null}><Modal open onClose={close} labelledBy="auth-title">
        <h2 id="auth-title" className="h-display pr-8 text-2xl">
          Te damos la bienvenida a Universo Agustino
        </h2>
        <p className="mb-6 mt-2 text-sm text-zinc-500">Ingresa con tu cuenta institucional para acceder a los recursos de estudio</p>
        <OAuthButtons status={status} />
        <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase text-zinc-400" aria-hidden="true">
          <span className="h-px flex-1 bg-zinc-200" />o<span className="h-px flex-1 bg-zinc-200" />
        </div>
        <Suspense fallback={<p role="status" className="py-3 text-center text-sm text-zinc-500">Cargando acceso por correo…</p>}><EmailCodeLogin onDone={close} /></Suspense>
        <p className="mt-4 flex items-start gap-2 rounded-xl border-2 border-zinc-900 bg-primary-soft p-3 text-xs text-zinc-700">
          <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">verified_user</span>
          <span>
            Exclusivo para la comunidad UNSA: solo se aceptan correos <b>@unsa.edu.pe</b> verificados. Con Apple, comparte tu correo institucional (no uses &quot;Ocultar mi correo&quot;).
          </span>
        </p>
        <p className="mt-4 text-center text-[11px] text-zinc-500">
          Al continuar aceptas los{" "}
          <Link to={ROUTES.legal} onClick={close} className="font-semibold underline hover:text-zinc-800">
            términos y la política de privacidad
          </Link>
          .
        </p>
      </Modal></Suspense>}
    </Ctx.Provider>
  );
}
