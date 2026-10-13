import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportsCenter } from "./ReportsCenter";

it("conserva la lista de reportes y ya no solicita IDs manuales", () => {
  const html = renderToStaticMarkup(<ReportsCenter reports={[{ id: "r-1", targetType: "document", targetId: "doc-12345678", reason: "Contenido copiado", status: "OPEN", createdAt: "2026-10-12" }]} onSent={() => {}} />);
  expect(html).toContain("Contenido copiado");
  expect(html).toContain("Para reportar una publicación");
  expect(html).not.toContain("ID del pedido, ítem o usuario");
  expect(html).not.toContain('placeholder="Describe la devolución');
});
