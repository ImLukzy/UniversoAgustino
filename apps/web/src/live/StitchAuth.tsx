import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "./careerTheme";

const itemCls =
  "px-space-sm py-space-xs rounded-lg text-left font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors w-full";

// Reemplaza la cuenta falsa del header Stitch ("Lic. Sofía V.") por sesión real:
// sin login muestra Iniciar sesión + Registrarse; con login muestra el usuario real y su menú.
export function StitchAuth() {
  const { user, logout } = useAuth();
  const { accent } = useCareerTheme();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const pending = useQuery({
    queryKey: ["auth-pending"],
    queryFn: async () => (await api.get("/orders/mine")).data.data as Array<{ status: string }>,
    enabled: !!user,
    refetchInterval: 30000,
  });
  const escrow = (pending.data ?? []).filter((o) => o.status === "ESCROW").length;

  if (!user) {
    return (
      <div className="flex items-center gap-space-xs">
        <Link
          to="/login"
          className="px-space-md py-space-sm rounded-full text-on-surface-variant font-label-md text-label-md font-semibold hover:bg-surface-container transition-colors whitespace-nowrap"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          style={accent ? { backgroundColor: accent.color } : undefined}
          className="px-space-md py-space-sm rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-sm whitespace-nowrap"
        >
          Registrarse
        </Link>
      </div>
    );
  }

  const name = user.profile?.fullName?.trim() || user.email;
  const initial = name.charAt(0).toUpperCase();
  const isMod = user.role === "admin" || user.role === "moderator";

  const out = async () => {
    await logout();
    setOpen(false);
    nav("/");
  };

  return (
    <div className="relative flex items-center gap-space-sm">
      <button
        onClick={() => nav("/pedidos")}
        aria-label="Notificaciones"
        title={escrow > 0 ? `${escrow} pedido(s) en custodia` : "Mis pedidos"}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative"
      >
        <span className="material-symbols-outlined text-title-lg">notifications</span>
        {escrow > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />}
      </button>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-space-sm pl-space-xs" aria-label="Mi cuenta">
        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-label-lg shrink-0" style={{ backgroundColor: accent?.color ?? "#0d9488" }}>
          {initial}
        </span>
        <span className="hidden md:flex flex-col text-left">
          <span className="font-label-md text-label-md text-on-surface font-semibold max-w-[150px] truncate">{name}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {user.role}
            {user.profile?.university ? ` · ${user.profile.university}` : ""}
          </span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-xl bg-surface-container-lowest shadow-lg p-space-xs flex flex-col z-50">
          <Link to="/cuenta" onClick={() => setOpen(false)} className={itemCls}>Mi cuenta</Link>
          <Link to="/pedidos" onClick={() => setOpen(false)} className={itemCls}>
            Mis pedidos{escrow > 0 ? ` (${escrow} en custodia)` : ""}
          </Link>
          {isMod && (
            <Link to="/admin" onClick={() => setOpen(false)} className={itemCls}>Moderación</Link>
          )}
          <button onClick={out} className={itemCls}>Salir</button>
        </div>
      )}
    </div>
  );
}
