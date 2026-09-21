import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { api, type HubOrder, type HubReport } from "../lib/api";

// Barra inferior fija para moverse entre Resumen y los módulos de Mi Espacio.
export function PanelTabs() {
  const { user } = useAuth();
  const { accent } = useCareerTheme();
  const isMod = user?.role === "admin" || user?.role === "moderator";

  const sales = useQuery({
    queryKey: ["tabs-sales"],
    queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[],
    enabled: !!user,
    staleTime: 30000,
    retry: false,
  });
  const mineReports = useQuery({
    queryKey: ["tabs-reports-mine"],
    queryFn: async () => (await api.get("/reports/mine")).data.data as HubReport[],
    enabled: !!user,
    staleTime: 30000,
    retry: false,
  });
  const globalReports = useQuery({
    queryKey: ["tabs-reports-open"],
    queryFn: async () => (await api.get("/reports")).data.data as Array<{ status: string }>,
    enabled: !!user && isMod,
    staleTime: 30000,
    retry: false,
  });

  const pendingRentals = (sales.data ?? []).filter((o) => o.itemType === "bazar" && o.status === "PENDING").length;
  const openMine = (mineReports.data ?? []).filter((r) => r.status === "OPEN").length;
  const ventasBadge = pendingRentals + openMine;
  const modBadge = (globalReports.data ?? []).filter((r) => r.status === "OPEN").length;

  const tabs = [
    { to: "/panel", icon: "dashboard", label: "Resumen / Mi Espacio", badge: 0 },
    { to: "/pedidos", icon: "receipt_long", label: "Mis Pedidos", badge: 0 },
    { to: "/publicaciones", icon: "storefront", label: "Mi Bazar", badge: 0 },
    { to: "/ventas", icon: "point_of_sale", label: "Gestión de Ventas", badge: ventasBadge },
    { to: "/cuenta", icon: "person", label: "Mi Cuenta", badge: 0 },
    ...(isMod ? [{ to: "/admin", icon: "gavel", label: "Moderación", badge: modBadge }] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-stretch justify-start gap-1 overflow-x-auto px-3" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors ${
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-800"
              }`
            }
            style={({ isActive }) =>
              isActive && accent ? { color: accent.color } : undefined
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-lg">{t.icon}</span>
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className="ml-0.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                    style={accent ? { backgroundColor: accent.color } : undefined}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
