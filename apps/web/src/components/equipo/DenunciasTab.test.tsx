import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { ReportCard, type ReportEntry } from "./ReportCard";
import { SanctionForm } from "./SanctionForm";

const report: ReportEntry = {
  id: "report-1", targetType: "order", targetId: "order-1", category: "NO_SHOW", reason: "El vendedor no llegó al punto acordado.", status: "OPEN", createdAt: "2026-10-12T12:00:00Z",
  reporter: { id: "buyer-1", nombre: "Ana Compradora" }, owner: { id: "seller-1", nombre: "Luis Vendedor", correo: "luis@unsa.edu.pe" },
  publication: { type: "bazar", id: "listing-1", title: "Calculadora científica" },
};

describe("contexto de denuncias", () => {
  it("muestra denunciante, vendedor, publicación enlazada y categoría", () => {
    const html = renderToStaticMarkup(<StaticRouter location="/panel/denuncias"><ReportCard report={report} admin={false} busy={false} onAction={() => {}} /></StaticRouter>);
    expect(html).toContain("No se presentó");
    expect(html).toContain("Ana Compradora");
    expect(html).toContain("Luis Vendedor");
    expect(html).toContain("luis@unsa.edu.pe");
    expect(html).toContain('<a class="font-bold text-primary-ink underline" href="/p/bazar/listing-1">Calculadora científica</a>');
    expect(html).toContain("Retirar publicación");
  });

  it("solo ofrece retirar cuando el reporte tiene publicación", () => {
    const html = renderToStaticMarkup(<StaticRouter location="/"><ReportCard report={{ ...report, publication: undefined }} admin={false} busy={false} onAction={() => {}} /></StaticRouter>);
    expect(html).not.toContain("Retirar publicación");
    expect(html).toContain("Desestimar");
  });
});

describe("sanciones por rol", () => {
  it("permite al trabajador advertir o suspender, pero reserva el bloqueo al técnico", () => {
    const worker = renderToStaticMarkup(<SanctionForm userId="seller-1" admin={false} done={() => {}} />);
    const admin = renderToStaticMarkup(<SanctionForm userId="seller-1" admin done={() => {}} />);
    expect(worker).toContain("Advertencia");
    expect(worker).toContain("Suspensión");
    expect(worker).not.toContain("Bloqueo");
    expect(admin).toContain("Bloqueo");
  });
});
