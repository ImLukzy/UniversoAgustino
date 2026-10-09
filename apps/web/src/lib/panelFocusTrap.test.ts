import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { trapPanelFocus } from "../components/teamPanel/focusTrap";
const listeners = new Map<string, (e: KeyboardEvent | FocusEvent) => void>();
const doc = { activeElement: null as Element | null, addEventListener: vi.fn((type, fn) => listeners.set(type, fn)), removeEventListener: vi.fn((type) => listeners.delete(type)) };
class Element {
  isConnected = true; visible = true; children: Element[] = []; focus = vi.fn(() => { doc.activeElement = this; });
  getClientRects() { return this.visible ? [{}] : []; }
  querySelectorAll() { return this.children; }
  contains(node: Element) { return node === this || this.children.includes(node); }
}
let dialog: Element, first: Element, last: Element, previous: Element;
const close = vi.fn();
const key = (k: string, shiftKey = false) => {
  const preventDefault = vi.fn(); listeners.get("keydown")?.({ key: k, shiftKey, preventDefault } as unknown as KeyboardEvent);
  return preventDefault;
};
beforeEach(() => {
  listeners.clear(); vi.clearAllMocks(); vi.stubGlobal("document", doc); vi.stubGlobal("HTMLElement", Element);
  dialog = new Element(); first = new Element(); last = new Element(); previous = new Element();
  dialog.children = [first, last]; doc.activeElement = previous;
});
afterEach(() => vi.unstubAllGlobals());
const start = () => trapPanelFocus(dialog as unknown as HTMLElement, close);
it("abre enfocando primer control y restaura disparador al cerrar", () => { const stop = start(); expect(doc.activeElement).toBe(first); stop(); expect(doc.activeElement).toBe(previous); expect(listeners.size).toBe(0); });
it("Tab desde último vuelve al primero", () => { const stop = start(); last.focus(); expect(key("Tab")).toHaveBeenCalled(); expect(doc.activeElement).toBe(first); stop(); });
it("ShiftTab desde primero vuelve al último", () => { const stop = start(); expect(key("Tab", true)).toHaveBeenCalled(); expect(doc.activeElement).toBe(last); stop(); });
it("Esc cierra y evita acción de fondo", () => { const stop = start(); expect(key("Escape")).toHaveBeenCalled(); expect(close).toHaveBeenCalledTimes(1); stop(); });
it("foco externo vuelve al diálogo", () => { const stop = start(); previous.focus(); listeners.get("focusin")?.({ target: previous } as unknown as FocusEvent); expect(doc.activeElement).toBe(first); stop(); });
it("sin controles Tab enfoca diálogo", () => { dialog.children = []; const stop = start(); expect(key("Tab")).toHaveBeenCalled(); expect(doc.activeElement).toBe(dialog); stop(); });
it("ignora controles ocultos", () => { first.visible = false; const stop = start(); expect(doc.activeElement).toBe(last); stop(); });
it("no restaura foco en botón eliminado", () => { const stop = start(); previous.isConnected = false; stop(); expect(previous.focus).not.toHaveBeenCalled(); });
it("Tab interior permite navegación nativa", () => { const stop = start(); expect(key("Tab")).not.toHaveBeenCalled(); stop(); });
