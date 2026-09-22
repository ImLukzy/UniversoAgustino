import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api, type HubNotification } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "./careerTheme";

const itemCls =
  "px-space-sm py-space-xs rounded-lg text-left font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors w-full min-h-[44px] flex items-center";

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
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-title-lg">notifications</span>
          {/* Punto con el acento de la carrera (pulso) en vez del rojo genérico;
              el contador de no leídas conserva el rojo como color de estado. */}
          {hasAlert && (
            <motion.span
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: accent?.color ?? "#dc2626" }}
            />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-12 z-50 flex w-80 max-w-[85vw] flex-col divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-surface-container-lowest p-space-xs shadow-md"
            >
              <div className="flex items-center justify-between px-space-sm py-space-xs">
                <span className="font-label-md text-label-md font-bold">Notificaciones</span>
                <button onClick={() => { void markAllRead(); }} className="min-h-[44px] px-2 text-xs font-semibold text-primary hover:underline">
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
                className="mt-1 min-h-[44px] rounded-lg bg-slate-100 px-space-sm py-space-xs text-center text-xs font-bold hover:bg-slate-200"
              >
                {needSeller > 0 ? "Ir a Gestión de Ventas" : "Ver mis pedidos"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={() => setOpen((v) => !v)} className="flex min-h-[44px] items-center gap-space-sm pl-space-xs" aria-label="Mi cuenta" aria-expanded={open}>
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-12 z-50 flex w-56 flex-col divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-surface-container-lowest p-space-xs shadow-md"
          >
            <Link to="/panel" onClick={() => setOpen(false)} className={itemCls}>Panel</Link>
            <button onClick={out} className={itemCls}>Salir</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
