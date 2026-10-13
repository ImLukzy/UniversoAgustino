import { expect, it } from "vitest";
import { visibleSections, isTeamRole, legacyPanelPath, panelPath } from "../components/teamPanel/navigation";
it.each(["student", "creator", "", undefined])("rol %s no obtiene secciones del panel", (role) => { expect(isTeamRole(role)).toBe(false); expect(visibleSections(role)).toEqual([]); });
it("trabajador ve Todas las publicaciones sin Miembros", () => { const rows = visibleSections("moderator"); expect(rows).toHaveLength(13); expect(rows.some((r) => r.slug === "catalogo" && r.label === "Todas las publicaciones")).toBe(true); expect(rows.some((r) => r.slug === "miembros")).toBe(false); });
it("Técnico ve Todas las publicaciones y Miembros", () => { const rows = visibleSections("admin"); expect(rows).toHaveLength(14); expect(rows.some((r) => r.slug === "catalogo")).toBe(true); expect(rows.some((r) => r.slug === "miembros")).toBe(true); });
it("menú tiene cuatro grupos operativos y destinos únicos", () => {
  const rows = visibleSections("admin"); expect([...new Set(rows.map((r) => r.group))]).toEqual(["Operación", "Pagos", "Moderación", "Configuración"]);
  expect(new Set(rows.map((r) => panelPath(r.slug))).size).toBe(14);
});
it.each([
  ["pagos", "/panel/pagos-por-verificar"], ["liquidaciones", "/panel/pagos-a-vendedores"],
  ["Casos", "/panel/casos"], ["Agenda", "/panel/agenda"], ["Miembros", "/panel/miembros"],
  ["Publicaciones", "/panel/publicaciones"], ["Sedes y horarios", "/panel/sedes-y-horarios"],
  ["Completas", "/panel/completas"], ["Ganancias", "/panel/ganancias"], ["Cuentas de cobro", "/panel/cuentas-de-cobro"],
  [null, "/panel/resumen"], ["invalid", "/panel/resumen"],
])("enlace heredado %s conserva destino %s", (tab, path) => expect(legacyPanelPath(tab)).toBe(path));
