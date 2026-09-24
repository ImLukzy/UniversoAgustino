import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";
import { SPRING } from "../lib/motion";

// Menú del avatar (solo sesión iniciada): Notificaciones (con punto real de
// no leídas), Perfil, Suscripción, Ajustes y Cerrar sesión. Cada item lleva
// a una ruta real; nada es decorativo.
export function ProfileMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await api.get("/notifications", { params: { unread: 1, pageSize: 1 } })).data.total as number,
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  });
  const unreadCount = unread.data ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = user.profile?.fullName?.trim() || user.email;
  const initial = (name.charAt(0) || "U").toUpperCase();

  const out = async () => {
    setOpen(false);
    await logout();
    nav(ROUTES.home);
  };

  const itemCls =
    "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-bold text-zinc-800 transition-colors hover:bg-zinc-100";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mi cuenta"
        aria-expanded={open}
        aria-haspopup="menu"
        className="price relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary text-lg text-primary-ink transition-transform hover:-translate-y-px"
      >
        {initial}
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#dc2626]" aria-label={`${unreadCount} sin leer`} />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={SPRING}
            role="menu"
            className="card absolute right-0 top-12 z-50 flex w-60 flex-col divide-y divide-dashed divide-zinc-300 p-1.5"
          >
            <div>
              <Link to={ROUTES.notifications} onClick={() => setOpen(false)} role="menuitem" className={itemCls}>
                <span className="material-symbols-outlined text-xl text-zinc-500">notifications</span>
                <span className="flex-1">Notificaciones</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link to={ROUTES.perfil} onClick={() => setOpen(false)} role="menuitem" className={itemCls}>
                <span className="material-symbols-outlined text-xl text-zinc-500">person</span> Perfil
              </Link>
              <Link to={ROUTES.subscription} onClick={() => setOpen(false)} role="menuitem" className={itemCls}>
                <span className="material-symbols-outlined text-xl text-zinc-500">payments</span> Suscripción
              </Link>
              <Link to={ROUTES.settings} onClick={() => setOpen(false)} role="menuitem" className={itemCls}>
                <span className="material-symbols-outlined text-xl text-zinc-500">settings</span> Ajustes
              </Link>
            </div>
            <div className="pt-1">
              <button onClick={out} role="menuitem" className={itemCls + " w-full text-left"}>
                <span className="material-symbols-outlined text-xl text-zinc-500">logout</span> Cerrar sesión
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
