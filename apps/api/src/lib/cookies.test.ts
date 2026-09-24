import { describe, expect, it } from "vitest";
import { isAllowedOrigin, refreshCookieOptions, trustProxyHops } from "./cookies.js";

describe("cookie de sesión y proxy (producción en Render)", () => {
  it("usa SameSite=None + Secure solo en producción", () => {
    expect(refreshCookieOptions("production")).toMatchObject({ sameSite: "none", secure: true, httpOnly: true });
    expect(refreshCookieOptions("development")).toMatchObject({ sameSite: "lax", httpOnly: true });
    expect(refreshCookieOptions("development").secure).toBeUndefined();
  });

  it("confía en 1 proxy en producción salvo TRUST_PROXY explícito", () => {
    expect(trustProxyHops("production", undefined)).toBe(1);
    expect(trustProxyHops("development", undefined)).toBe(0);
    expect(trustProxyHops("production", "2")).toBe(2);
    expect(trustProxyHops("production", "0")).toBe(0);
    expect(trustProxyHops("production", "abc")).toBe(1);
  });

  it("compara el origen exacto (Origin o Referer)", () => {
    const allowed = ["https://universo.pe", "http://localhost:5173/"];
    expect(isAllowedOrigin(allowed, "https://universo.pe")).toBe(true);
    expect(isAllowedOrigin(allowed, "https://universo.pe/pedidos?x=1")).toBe(true);
    expect(isAllowedOrigin(allowed, "http://localhost:5173")).toBe(true);
    expect(isAllowedOrigin(allowed, "https://universo.pe.evil.com")).toBe(false);
    expect(isAllowedOrigin(allowed, "http://universo.pe")).toBe(false);
    expect(isAllowedOrigin(allowed, "basura")).toBe(false);
    expect(isAllowedOrigin(allowed, "")).toBe(true);
  });
});
