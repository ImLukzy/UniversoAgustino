import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { ListingRow } from "./ListingRow";
import { EditorActions } from "./EditorActions";
import type { useListingEditor } from "./useListingEditor";
import type { Listing } from "./listing";

const listing: Listing = { kind: "doc", id: "doc", title: "Apunte de prueba", sub: "Anatomía", price: 1000, createdAt: "", doc: {
  id: "doc", title: "Apunte de prueba", course: "Anatomía", university: "UNSA", cycle: "I", type: "APUNTE", priceCents: 1000, status: "PUBLISHED", reviewStatus: "APPROVED", pausedAt: "2026-10-12T12:00:00Z",
} };
const editor = (pausedAt: string | null, confirmingPause = false) => ({ busy: false, msg: "", confirming: false, confirmingPause, pausedAt,
  askDelete: () => {}, cancelDelete: () => {}, askPause: () => {}, cancelPause: () => {}, save: async () => {}, remove: async () => {}, pause: async () => {}, resume: async () => {},
}) as unknown as ReturnType<typeof useListingEditor>;

describe("publicaciones pausadas", () => {
  it("muestra la etiqueta Pausada en vez del estado activo", () => {
    const html = renderToStaticMarkup(<StaticRouter location="/"><ListingRow listing={listing} sales={[]} open={false} onToggle={() => {}} onQr={() => {}} /></StaticRouter>);
    expect(html).toContain("Pausada"); expect(html).not.toContain("Activa");
  });
  it("muestra Pausar si está activa y Reactivar si está pausada", () => {
    const render = (pausedAt: string | null) => renderToStaticMarkup(<EditorActions ed={editor(pausedAt)} title="Apunte" liveOrders={0} oldPrice={1000} newPrice={1000} onSave={() => {}} />);
    expect(render(null)).toContain(">Pausar</button>");
    expect(render("2026-10-12T12:00:00Z")).toContain(">Reactivar</button>");
    expect(render("2026-10-12T12:00:00Z")).not.toContain(">Pausar</button>");
  });
  it("confirma la pausa con el modal existente", () => {
    const html = renderToStaticMarkup(<EditorActions ed={editor(null, true)} title="Apunte" liveOrders={0} oldPrice={1000} newPrice={1000} onSave={() => {}} />);
    expect(html).toContain("Pausar publicación"); expect(html).toContain("No aparecerá en el catálogo hasta que la reactives.");
  });
});
