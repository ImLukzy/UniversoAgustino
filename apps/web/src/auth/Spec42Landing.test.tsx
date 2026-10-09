import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { LandingHero } from "../components/landing/LandingHero";
import { AppLayout } from "../components/AppLayout";

vi.mock("react-router-dom", () => ({
  Link: ({ to, className, children }: { to: string; className?: string; children: ReactNode }) => <a href={to} className={className}>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock("../components/landing/HeroWidgetCard", () => ({ HeroWidgetCard: () => <div>Widget</div> }));
vi.mock("../components/AppSidebar", () => ({ AppSidebar: () => <div /> }));
vi.mock("../components/ProfileMenu", () => ({ ProfileMenu: () => <button>Perfil</button> }));
vi.mock("../components/AppFooter", () => ({ AppFooter: () => <footer /> }));
vi.mock("../components/SuspensionBanner", () => ({ SuspensionBanner: () => null }));
vi.mock("../components/AuthModalHost", () => ({ useAuthModal: () => ({ openAuth: vi.fn() }) }));
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

const render = (node: ReactNode) => renderToStaticMarkup(node);

describe("Spec 42: acceso a Inicio y CTA autenticada", () => {
  it("muestra Inicio en el header también en móvil y conserva su destino", () => {
    const html = render(<AppLayout><p>Contenido</p></AppLayout>);
    expect(html).toMatch(/<a[^>]*href="\/inicio"[^>]*class="[^"]*btn-ghost btn-sm shrink-0 whitespace-nowrap[^"]*">Inicio<\/a>/);
    expect(html).not.toContain("hidden md:inline-flex");
  });

  it("ofrece Ir a Explorar en la landing con sesión y no lo duplica sin sesión", () => {
    const signedIn = render(<LandingHero withSession />);
    expect(signedIn).toContain('href="/explorar"');
    expect(signedIn).toContain("Ir a Explorar");
    const publicLanding = render(<LandingHero />);
    expect(publicLanding).not.toContain("Ir a Explorar");
  });
});

describe("Spec 43: landing con sesión", () => {
  it("muestra el menú de perfil en la barra y no el botón de login", () => {
    const signedIn = render(<LandingHero withSession />);
    expect(signedIn).toContain("Perfil");
    expect(signedIn).not.toContain("Iniciar sesión");
    const anon = render(<LandingHero />);
    expect(anon).toContain("Iniciar sesión");
    expect(anon).not.toContain("Perfil");
  });

  it("conserva el alto del hero con sesión con relleno inferior mayor", () => {
    expect(render(<LandingHero withSession />)).toContain("sm:pb-56");
    expect(render(<LandingHero />)).toContain("pb-20");
  });
});
