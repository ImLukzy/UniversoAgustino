export const PANEL_SECTIONS = [
  { slug: "resumen", label: "Resumen", group: "Operación", icon: "dashboard" },
  { slug: "casos", label: "Casos", group: "Operación", icon: "inventory_2" },
  { slug: "agenda", label: "Agenda", group: "Operación", icon: "calendar_month" },
  { slug: "pagos-por-verificar", label: "Pagos por verificar", group: "Pagos", icon: "fact_check" },
  { slug: "pagos-a-vendedores", label: "Pagos a vendedores", group: "Pagos", icon: "payments" },
  { slug: "completas", label: "Completas", group: "Pagos", icon: "task_alt" },
  { slug: "ganancias", label: "Ganancias", group: "Pagos", icon: "monitoring" },
  { slug: "cuentas-de-cobro", label: "Cuentas de cobro", group: "Pagos", icon: "account_balance" },
  { slug: "publicaciones", label: "Publicaciones", group: "Moderación", icon: "menu_book" },
  { slug: "denuncias", label: "Denuncias", group: "Moderación", icon: "flag" },
  { slug: "usuarios", label: "Usuarios", group: "Moderación", icon: "group" },
  { slug: "sedes-y-horarios", label: "Sedes y horarios", group: "Configuración", icon: "location_on" },
  { slug: "miembros", label: "Miembros", group: "Configuración", icon: "manage_accounts", admin: true },
] as const;
export type PanelSlug = typeof PANEL_SECTIONS[number]["slug"];
export const panelPath = (slug: PanelSlug) => `/panel/${slug}`;
export const isTeamRole = (role?: string) => role === "admin" || role === "moderator";
export const visibleSections = (role?: string) => !isTeamRole(role) ? [] : PANEL_SECTIONS.filter((s) => !("admin" in s) || role === "admin");
export function legacyPanelPath(tab: string | null) {
  const alias = tab === "pagos" ? "Pagos por verificar" : tab === "liquidaciones" ? "Pagos a vendedores" : tab;
  return panelPath(PANEL_SECTIONS.find((s) => s.label === alias)?.slug ?? "resumen");
}
