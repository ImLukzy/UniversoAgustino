import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EffectCallback } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "../lib/api";

const effects = vi.hoisted(() => [] as EffectCallback[]);
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: EffectCallback) => effects.push(effect),
}));
vi.mock("../lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() }, setAccessToken: vi.fn() }));
let state: ReturnType<typeof useAuth>;
let storage: Map<string, string>;
let events: EventTarget;
let cleanup: ReturnType<EffectCallback>;
const hint = "ua-session-hint";
const user = { id: "test-user", email: "test@unsa.edu.pe", role: "USER" };
function Probe() { state = useAuth(); return null; }
function mount() {
  renderToStaticMarkup(<AuthProvider><Probe /></AuthProvider>);
  cleanup = effects[0]();
}
async function settle() { await Promise.resolve(); await Promise.resolve(); }
beforeEach(() => {
  vi.clearAllMocks(); effects.length = 0; storage = new Map(); events = new EventTarget();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal("window", events);
  vi.mocked(api.get).mockImplementation(() => new Promise(() => {}));
  vi.mocked(api.post).mockResolvedValue({ data: { data: { ...user, access: "test-access" } } });
});
afterEach(() => { if (typeof cleanup === "function") cleanup(); vi.unstubAllGlobals(); });

describe("pista de sesión", () => {
  it("sin pista arranca cargando y consulta la sesión en segundo plano", () => {
    mount(); expect(state.hadSession).toBe(false); expect(state.loading).toBe(true);
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });
  it("solo el valor 1 indica una sesión previa", () => {
    storage.set(hint, "otro"); mount(); expect(state.hadSession).toBe(false);
    storage.set(hint, "1"); mount(); expect(state.hadSession).toBe(true);
  });
  it("bootstrap guarda únicamente la pista no sensible", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: user } });
    mount(); await settle(); expect([...storage]).toEqual([[hint, "1"]]);
  });
  it("bootstrap fallido borra la pista", async () => {
    storage.set(hint, "1"); vi.mocked(api.get).mockRejectedValue(new Error("sin sesión"));
    mount(); await settle(); expect(storage.has(hint)).toBe(false);
  });
  it.each(["login", "register", "refreshMe"] as const)("%s escribe la pista tras /auth/me", async (action) => {
    mount(); vi.mocked(api.get).mockResolvedValue({ data: { data: user } });
    if (action === "login") await state.login(user.email, "password");
    else if (action === "register") await state.register({ email: user.email, password: "password", fullName: "Test", university: "UNSA" });
    else await state.refreshMe();
    expect([...storage]).toEqual([[hint, "1"]]);
  });
  it.each(["login", "register", "refreshMe"] as const)("%s borra la pista si /auth/me falla", async (action) => {
    storage.set(hint, "1"); mount(); vi.mocked(api.get).mockRejectedValue(new Error("sin sesión"));
    if (action === "login") await expect(state.login(user.email, "password")).rejects.toThrow("sin sesión");
    else if (action === "register") await state.register({ email: user.email, password: "password", fullName: "Test", university: "UNSA" });
    else await state.refreshMe();
    expect(storage.has(hint)).toBe(false);
  });
  it("logout borra la pista aunque falle el endpoint", async () => {
    storage.set(hint, "1"); mount(); vi.mocked(api.post).mockRejectedValue(new Error("offline"));
    await state.logout(); expect(storage.has(hint)).toBe(false);
  });
  it("auth:logout borra la pista", () => {
    storage.set(hint, "1"); mount(); events.dispatchEvent(new Event("auth:logout"));
    expect(storage.has(hint)).toBe(false);
  });
  it("almacenamiento bloqueado no rompe bootstrap, login ni logout", async () => {
    const blocked = () => { throw new Error("SecurityError"); };
    vi.stubGlobal("localStorage", { getItem: blocked, setItem: blocked, removeItem: blocked });
    mount(); expect(state.hadSession).toBe(false);
    vi.mocked(api.get).mockResolvedValue({ data: { data: user } });
    await state.login(user.email, "password"); await state.logout();
  });
  it("una respuesta tras desmontar no modifica la pista", async () => {
    let resolve!: (value: { data: { data: typeof user } }) => void;
    vi.mocked(api.get).mockImplementation(() => new Promise((done) => { resolve = done; }));
    mount(); if (typeof cleanup === "function") cleanup();
    resolve({ data: { data: user } }); await settle(); expect(storage.has(hint)).toBe(false);
  });
});
