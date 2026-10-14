import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Pedidos } from "../../pages/Pedidos";

vi.mock("../../auth/AuthContext", () => ({ useAuth: () => ({ user: { id: "buyer", role: "student" } }) }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: [], isLoading: false }) }));
vi.mock("./DeliverySites", () => ({ DeliverySites: () => null }));

it("muestra ayuda al comprador sin enlazar a ventas desde la tarjeta", () => {
  const html = renderToStaticMarkup(<StaticRouter location="/pedidos"><Pedidos /></StaticRouter>);
  expect(html).toContain("¿Problemas con un pedido? Ábrelo en la lista y usa");
  expect(html).toContain("Reportar al vendedor");
  expect(html).toContain("Enviar reclamo");
  expect(html).not.toContain("¿Problemas? Abrir un reporte");
  const aside = html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/)?.[1] ?? "";
  expect(aside).not.toContain('href="/ventas"');
});
