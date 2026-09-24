import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberReturnTo, safeReturnPath, takeReturnTo } from "./authRedirect";

describe("safeReturnPath", () => {
  it("acepta rutas internas relativas con query y hash", () => {
    expect(safeReturnPath("/")).toBe("/");
    expect(safeReturnPath("/explorar?career=MEDICINA")).toBe("/explorar?career=MEDICINA");
    expect(safeReturnPath("/v/abc#p3")).toBe("/v/abc#p3");
  });

  it("rechaza vacíos, URLs absolutas y open redirects", () => {
    for (const p of [null, undefined, "", "explorar", "https://evil.com", "//evil.com", "//evil.com/x", "javascript:alert(1)"]) {
      expect(safeReturnPath(p)).toBeNull();
    }
  });

  it("rechaza las pantallas de auth para no volver al login", () => {
    for (const p of ["/login", "/login?next=/panel", "/auth/callback", "/register", "/forgot-password", "/reset-password?t=1"]) {
      expect(safeReturnPath(p)).toBeNull();
    }
  });
});

describe("rememberReturnTo / takeReturnTo", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("guarda una ruta segura y la entrega una sola vez", () => {
    rememberReturnTo("/checkout/42");
    expect(takeReturnTo()).toBe("/checkout/42");
    expect(takeReturnTo()).toBeNull();
  });

  it("una ruta insegura borra el destino anterior", () => {
    rememberReturnTo("/panel");
    rememberReturnTo("//evil.com");
    expect(takeReturnTo()).toBeNull();
  });

  it("sin storage no lanza y vuelve al inicio", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    });
    expect(() => rememberReturnTo("/panel")).not.toThrow();
    expect(takeReturnTo()).toBeNull();
  });
});
