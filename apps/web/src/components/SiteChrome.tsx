import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// Barra superior + inferior persistentes (estilo app: siempre visibles,
// también en login / registro / recuperar). Identidad Wawki · UNSA.
const NAV = [
  { to: "/", label: "Marketplace" },
  { to: "/bazar", label: "Bazar & Alquiler" },
  { to: "/monetiza", label: "Vender & Monetizar" },
  { to: "/legal", label: "Marco Legal" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "linear-gradient(135deg,#0d9488,#4648d4)" }}>
            <span className="material-symbols-outlined text-xl">local_hospital</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Wawki</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Arequipa · UNSA</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${pathname === n.to ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-600 sm:inline">
                {user.profile?.fullName ?? user.email}
              </span>
              <Link to="/cuenta" className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110" style={{ background: "linear-gradient(90deg,#0d9488,#4648d4)" }}>
                Mi cuenta
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 sm:inline">
                Iniciar sesión
              </Link>
              <Link to="/register" className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110" style={{ background: "#0d9488" }}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-extrabold tracking-tight text-white">Wawki <span className="text-sm font-semibold text-slate-400">Arequipa</span></p>
          <p className="text-sm text-slate-400">Comunidad UNSA · Arequipa, Perú</p>
          <p className="text-xs text-slate-500">Apuntes verificados, bazar circular y monetización entre agustinos.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Plataforma</p>
          <Link className="hover:text-white" to="/">Marketplace</Link>
          <Link className="hover:text-white" to="/bazar">Bazar &amp; Alquiler</Link>
          <Link className="hover:text-white" to="/monetiza">Vender &amp; Monetizar</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Legal</p>
          <Link className="hover:text-white" to="/legal">Marco legal D.L. 822</Link>
          <Link className="hover:text-white" to="/legal">Términos y reportes</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cuenta</p>
          <Link className="hover:text-white" to="/login">Iniciar sesión</Link>
          <Link className="hover:text-white" to="/register">Registrarse</Link>
          <Link className="hover:text-white" to="/pedidos">Mis pedidos</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row">
          <span>© 2024 Wawki Arequipa · Comunidad UNSA</span>
          <span>D.L. 822 · Solo material original</span>
        </div>
      </div>
    </footer>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
