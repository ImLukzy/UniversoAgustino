import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { ROUTES } from "../../lib/routes";
import { apiError } from "../../lib/api";
import { PanelNavigation } from "./PanelNavigation";
export function PanelSidebar({ close }: { close?: () => void }) {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const name = user?.profile?.fullName?.trim() || user?.email || "Equipo";
  const out = async () => {
    setBusy(true); setError("");
    try { await logout(); close?.(); navigate(ROUTES.home, { replace: true }); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return <div className="flex h-full min-w-0 flex-col">
    <header className="shrink-0 border-b border-zinc-200 pb-3">
      <div className="flex min-w-0 items-center gap-2"><img src="/logo-ua.svg" width={32} height={32} alt="" /><span className="min-w-0 font-display text-base font-bold">Universo Agustino</span>
        {close && <button type="button" onClick={close} className="btn btn-secondary btn-sm ml-auto shrink-0 !px-2" aria-label="Cerrar menú"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>}</div>
      <div className="mt-3 flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-ink" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><p className="truncate text-sm font-bold">{name}</p><p className="text-xs text-zinc-600">{user?.role === "admin" ? "Técnico" : "Trabajador"} · Panel del equipo</p></div></div>
    </header>
    <div className="-mr-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-color:theme(colors.zinc.300)_transparent] [scrollbar-width:thin]" tabIndex={0} role="region" aria-label="Navegación del equipo"><PanelNavigation onAction={close} /></div>
    <footer className="flex shrink-0 flex-col gap-2 border-t border-zinc-200 pt-3 [&>.btn]:!h-10">
      <Link to={ROUTES.home} onClick={close} className="btn btn-secondary justify-start"><span className="material-symbols-outlined" aria-hidden="true">home</span>Volver al sitio</Link>
      <button type="button" disabled={busy} onClick={() => void out()} className="btn btn-secondary justify-start"><span className="material-symbols-outlined" aria-hidden="true">logout</span>{busy ? "Cerrando…" : "Cerrar sesión"}</button>
      {error && <p role="alert" className="break-words text-sm text-error">{error}</p>}
    </footer>
  </div>;
}
