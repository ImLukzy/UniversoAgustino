import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppFooter } from "../components/AppFooter";
const h = vi.hoisted(() => ({ user: null as null | { id: string }, logout: vi.fn() }));
vi.mock("./AuthContext", () => ({ useAuth: () => h }));
vi.mock("../components/AuthModalHost", () => ({ useAuthModal: () => ({ openAuth: vi.fn() }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn(), Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a> }));
describe("pie según sesión", () => {
  it("sin sesión ofrece iniciar y crear cuenta", () => {
    h.user = null;
    const html = renderToStaticMarkup(<AppFooter />);
    expect(html).toContain("Iniciar sesión"); expect(html).toContain("Crear cuenta"); expect(html).not.toContain("Cerrar sesión");
  });
  it("con sesión ofrece cuenta y cierre sin login", () => {
    h.user = { id: "user" };
    const html = renderToStaticMarkup(<AppFooter />);
    expect(html).toContain("Mi cuenta"); expect(html).toContain("Cerrar sesión");
    expect(html).not.toContain("Iniciar sesión"); expect(html).not.toContain("Crear cuenta");
  });
});
