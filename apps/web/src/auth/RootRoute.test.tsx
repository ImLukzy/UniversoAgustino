import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RootRoute } from "../app/AppRoutes";

const auth = vi.hoisted(() => ({ loading: true, hadSession: false, user: null as null | { id: string } }));
vi.mock("./AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../pages/Explorar", () => ({ Explorar: () => <div>marketplace</div> }));
vi.mock("../components/RouteFallback", () => ({ RouteFallback: () => <div>cargando</div> }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  lazy: () => () => <div>portada</div>,
}));

describe("RootRoute", () => {
  it.each([
    [true, false, null, "portada"],
    [true, true, null, "cargando"],
    [false, false, null, "portada"],
    [false, true, null, "portada"],
    [false, true, { id: "test" }, "marketplace"],
    [false, false, { id: "test" }, "marketplace"],
  ])("loading=%s, hadSession=%s, user=%s → %s", (loading, hadSession, user, expected) => {
    Object.assign(auth, { loading, hadSession, user });
    expect(renderToStaticMarkup(<RootRoute />)).toBe(`<div>${expected}</div>`);
  });
});
