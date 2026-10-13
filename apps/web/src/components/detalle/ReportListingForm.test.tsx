import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportListingForm } from "./ReportListingForm";

it("muestra las categorías accesibles y el detalle limitado", () => {
  const html = renderToStaticMarkup(<ReportListingForm type="document" listingId="doc-1" />);
  expect(html).toContain("Motivo del reporte");
  expect(html).toContain("No es lo anunciado");
  expect(html).toContain("Contenido inapropiado o copiado");
  expect(html).toContain("Otro");
  expect(html).toContain('aria-describedby="report-count-doc-1"');
  expect(html).toContain('minLength="10"');
  expect(html).toContain('maxLength="2000"');
  expect(html).not.toContain("aria-live");
});
