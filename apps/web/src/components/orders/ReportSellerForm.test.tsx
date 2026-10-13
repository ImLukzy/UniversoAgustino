import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { HubOrder } from "../../lib/api";
import { StaticRouter } from "react-router-dom";
import { BuyerOrderRow } from "./BuyerOrderRow";
import { ReportSellerForm } from "./ReportSellerForm";

const order = (status: string): HubOrder => ({ id: "order-1", buyerId: "buyer-1", createdAt: "2026-10-12", itemType: "document", itemId: "doc-1", itemTitle: "Apunte", amountCents: 1000, feeCents: 100, netCents: 900, status });

function renderRow(status: string) {
  const client = new QueryClient();
  return renderToStaticMarkup(<QueryClientProvider client={client}><StaticRouter location="/pedidos"><BuyerOrderRow order={order(status)} /></StaticRouter></QueryClientProvider>);
}

describe("reporte del vendedor desde el pedido", () => {
  it("muestra el botón solo fuera de PENDING y CANCELLED", () => {
    expect(renderRow("PENDING")).not.toContain("Reportar al vendedor");
    expect(renderRow("CANCELLED")).not.toContain("Reportar al vendedor");
    expect(renderRow("ACCEPTED")).toContain("Reportar al vendedor");
    expect(renderRow("RELEASED")).toContain("Reportar al vendedor");
  });

  it("presenta las cuatro categorías y labels del formulario", () => {
    const html = renderToStaticMarkup(<ReportSellerForm orderId="order-1" />);
    expect(html).toContain("¿Qué ocurrió?");
    expect(html).toContain('value="NO_SHOW"');
    expect(html).toContain("No se presentó");
    expect(html).toContain('value="NO_PRODUCT"');
    expect(html).toContain("No llevó el producto");
    expect(html).toContain('value="NOT_AS_DESCRIBED"');
    expect(html).toContain("No es lo anunciado");
    expect(html).toContain('value="OTHER"');
    expect(html).toContain("Otro");
    expect(html).toContain("Cuéntanos los detalles");
    expect(html).toContain('minLength="10"');
    expect(html).toContain('maxLength="2000"');
    expect(html).toContain('aria-describedby="report-count-order-1"');
    expect(html).not.toContain("aria-live");
  });
});
