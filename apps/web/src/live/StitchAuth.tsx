import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type HubNotification } from "../lib/api";
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
    queryKey: ["orders", "mine"],
    queryFn: async () => (await api.get("/orders/mine")).data.data as Array<{ status: string }>,
    enabled: !!user,
    refetchInterval: 30000,
  });
  // Sprint 1A: como vendedor, PENDING de bazar (por aceptar) y PAID (por
  // confirmar) requieren acción. El punto avisa y lleva a /ventas.
  const sales = useQuery({
    queryKey: ["orders", "sales"],
    queryFn: async () => (await api.get("/orders/sales")).data.data as Array<{ status: string; itemType: string }>,
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  });
  const escrow = (pending.data ?? []).filter((o) => o.status === "ESCROW").length;
  const needSeller = (sales.data ?? []).filter(
    (o) => (o.status === "PENDING" && o.itemType === "bazar") || o.status === "PAID",
  ).length;
  // Sprint F1-08: notificaciones in-app (lista reciente + conteo de no leídas).
  const [bellOpen, setBellOpen] = useState(false);
  const notifs = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: async () => (await api.get("/notifications", { params: { pageSize: 8 } })).data.data as HubNotification[],
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  });
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await api.get("/notifications", { params: { unread: 1, pageSize: 1 } })).data.total as number,
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  });
  const unreadCount = unread.data ?? 0;
  const hasAlert = escrow > 0 || needSeller > 0 || unreadCount > 0;

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    void notifs.refetch();
    void unread.refetch();
  };
  const openNotif = async (n: HubNotification) => {
    setBellOpen(false);
    if (!n.readAt) {
      try {
        await api.post(`/notifications/${n.id}/read`);
      } catch {
        /* noop: igual navega */
      }
      void notifs.refetch();
      void unread.refetch();
    }
    if (n.link?.startsWith("/")) nav(n.link);
  };

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

  const out = async () => {
    await logout();
    setOpen(false);
    nav("/");
  };

  return (
    <div className="relative flex items-center gap-space-sm">
      <div className="relative">
        <button
          onClick={() => setBellOpen((v) => !v)}
          aria-label="Notificaciones"
          title={
            needSeller > 0
              ? `${needSeller} venta(s) por atender`
              : escrow > 0
                ? `${escrow} pedido(s) en custodia`
                : unreadCount > 0
                  ? `${unreadCount} notificación(es) sin leer`
                  : "Sin novedades"
          }
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative"
        >
          <span className="material-symbols-outlined text-title-lg">notifications</span>
          {hasAlert && <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {bellOpen && (
          <div className="absolute right-0 top-12 w-80 max-w-[85vw] rounded-xl bg-surface-container-lowest shadow-lg p-space-xs flex flex-col z-50">
            <div className="flex items-center justify-between px-space-sm py-space-xs">
              <span className="font-label-md text-label-md font-bold">Notificaciones</span>
              <button onClick={() => { void markAllRead(); }} className="text-xs font-semibold text-primary hover:underline">
                Marcar leídas
              </button>
            </div>
            {(notifs.data ?? []).length === 0 && (
              <p className="px-space-sm py-space-md text-sm text-slate-500">
                Sin novedades. Tus reservas, pagos y avisos de custodia aparecen aquí.
              </p>
            )}
            {(notifs.data ?? []).map((n) => (
              <button
                key={n.id}
                onClick={() => openNotif(n)}
                className={`w-full rounded-lg px-space-sm py-space-xs text-left transition-colors hover:bg-surface-container ${n.readAt ? "" : "bg-primary/5"}`}
              >
                <span className="flex items-center gap-1 text-sm font-bold">
                  {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-error" />}
                  <span className="truncate">{n.title}</span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.body}</span>
              </button>
            ))}
            <button
              onClick={() => { setBellOpen(false); nav(needSeller > 0 ? "/ventas" : "/pedidos"); }}
              className="mt-1 rounded-lg bg-slate-100 px-space-sm py-space-xs text-center text-xs font-bold hover:bg-slate-200"
            >
              {needSeller > 0 ? "Ir a Gestión de Ventas" : "Ver mis pedidos"}
            </button>
          </div>
        )}
      </div>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-space-sm pl-space-xs" aria-label="Mi cuenta">
        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-label-lg shrink-0" style={{ backgroundColor: accent?.color ?? "rgb(var(--hub-p, 0 104 95))" }}>
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
          <Link to="/panel" onClick={() => setOpen(false)} className={itemCls}>Panel</Link>
          <button onClick={out} className={itemCls}>Salir</button>
        </div>
      )}
    </div>
  );
}
