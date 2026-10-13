import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { NotFound } from "../pages/NotFound";

vi.mock("../components/AppLayout", () => ({ AppLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("react-router-dom", () => ({ Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => <a href={to} className={className}>{children}</a> }));

it("muestra la página 404 con título y enlaces de salida", () => {
  const html = renderToStaticMarkup(<NotFound />);
  expect(html).toContain("<h1");
  expect(html).toContain("Esta página no existe");
  expect(html).toContain("Puede que el enlace esté mal escrito o que la página se haya movido.");
  expect(html).toContain('href="/"');
  expect(html).toContain("Ir al inicio");
  expect(html).toContain('href="/explorar"');
  expect(html).toContain("Explorar apuntes");
});
