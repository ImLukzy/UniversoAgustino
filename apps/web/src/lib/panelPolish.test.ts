import { expect, it } from "vitest";
import html from "../../index.html?raw";
import { PANEL_SECTIONS } from "../components/teamPanel/navigation";

const subset = new Set((html.match(/icon_names=([^"&\s]+)/)?.[1] ?? "").split(","));

it("todos los iconos del menú del panel están en el subset de Material Symbols", () => {
  const missing = PANEL_SECTIONS.map((s) => s.icon).filter((icon) => !subset.has(icon));
  expect(missing).toEqual([]);
});
it("los iconos de cabecera, cajón y pie del panel están en el subset", () => {
  for (const icon of ["menu", "close", "home", "logout"]) expect(subset.has(icon)).toBe(true);
});
it("cada sección tiene descripción propia y única para la cabecera", () => {
  const texts = PANEL_SECTIONS.map((s) => s.description);
  expect(texts.every((t) => t.trim().length > 10)).toBe(true);
  expect(new Set(texts).size).toBe(PANEL_SECTIONS.length);
});
it("ninguna descripción repite el nombre de la sección como único contenido", () => {
  for (const s of PANEL_SECTIONS) expect(s.description.trim().toLowerCase()).not.toBe(s.label.toLowerCase());
});
