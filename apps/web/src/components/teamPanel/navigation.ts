export const PANEL_SECTIONS = [
  { slug: "resumen", label: "Resumen", group: "Operación", icon: "dashboard", description: "Indicadores del día y denuncias por resolver." },
  { slug: "casos", label: "Casos", group: "Operación", icon: "inventory_2", description: "Objetos en custodia, entregas y devoluciones." },
  { slug: "agenda", label: "Agenda", group: "Operación", icon: "calendar_month", description: "Citas de la semana por sede y trabajador." },
  { slug: "pagos-por-verificar", label: "Pagos por verificar", group: "Pagos", icon: "fact_check", description: "Los primeros 50 comprobantes pendientes, del más antiguo al más reciente." },
  { slug: "pagos-a-vendedores", label: "Pagos a vendedores", group: "Pagos", icon: "payments", description: "Paga el neto indicado y adjunta tu comprobante." },
  { slug: "completas", label: "Completas", group: "Pagos", icon: "task_alt", description: "Liquidaciones ya pagadas a vendedores." },
  { slug: "ganancias", label: "Ganancias", group: "Pagos", icon: "monitoring", description: "Comisión de pedidos verificados durante el periodo. Horario de Lima." },
  { slug: "cuentas-de-cobro", label: "Cuentas de cobro", group: "Pagos", icon: "account_balance", description: "Solo las cuentas activas se muestran a compradores con un pedido activo." },
  { slug: "publicaciones", label: "Publicaciones", group: "Moderación", icon: "menu_book", description: "Documentos y bazar pendientes de revisión." },
  { slug: "denuncias", label: "Denuncias", group: "Moderación", icon: "flag", description: "Reportes D.L. 822 por resolver en menos de 48 horas." },
  { slug: "usuarios", label: "Usuarios", group: "Moderación", icon: "group", description: "Busca por correo o nombre para ver y sancionar cuentas." },
  { slug: "sedes-y-horarios", label: "Sedes y horarios", group: "Configuración", icon: "location_on", description: "Sedes, horario hábil, feriados y turnos · America/Lima." },
  { slug: "miembros", label: "Miembros", group: "Configuración", icon: "manage_accounts", description: "Personas con acceso al panel del equipo.", admin: true },
] as const;
export type PanelSlug = typeof PANEL_SECTIONS[number]["slug"];
export const panelPath = (slug: PanelSlug) => `/panel/${slug}`;
export const isTeamRole = (role?: string) => role === "admin" || role === "moderator";
export const visibleSections = (role?: string) => !isTeamRole(role) ? [] : PANEL_SECTIONS.filter((s) => !("admin" in s) || role === "admin");
export function legacyPanelPath(tab: string | null) {
  const alias = tab === "pagos" ? "Pagos por verificar" : tab === "liquidaciones" ? "Pagos a vendedores" : tab;
  return panelPath(PANEL_SECTIONS.find((s) => s.label === alias)?.slug ?? "resumen");
}
