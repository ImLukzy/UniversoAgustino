import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ProfileMenu } from "../components/ProfileMenu";
const auth = vi.hoisted(() => ({ user: { id: "u", email: "staff@unsa.edu.pe", role: "admin", profile: null } }));
vi.mock("./AuthContext", () => ({ useAuth: () => ({ ...auth, logout: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: 0 }) }));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(), useState: () => [true, vi.fn()] }));
beforeEach(() => { auth.user.role = "admin"; });
const html = () => renderToStaticMarkup(<StaticRouter location="/"><ProfileMenu /></StaticRouter>);
it.each(["admin", "moderator"])("%s Mi panel abre nueva pestaña sin opener", (role) => {
  auth.user.role = role;
  const link = html().match(/<a[^>]*href="\/panel"[^>]*>/)?.[0];
  expect(link).toContain('target="_blank"'); expect(link).toContain('rel="noopener"');
  expect(html()).toContain("Mi panel");
});
it.each(["student", "creator"])("%s no tiene entrada staff en perfil", (role) => { auth.user.role = role; expect(html()).not.toContain("Mi panel"); expect(html()).not.toContain('target="_blank"'); });
