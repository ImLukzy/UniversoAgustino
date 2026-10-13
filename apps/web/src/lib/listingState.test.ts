import { describe, expect, it } from "vitest";
import { isActiveListing } from "./listingState";
import type { HubBazarItem, HubDocument } from "./apiTypes";

const document: HubDocument = { id: "d", title: "Apunte", course: "Curso", university: "UNSA", cycle: "1", type: "APUNTE", priceCents: 100, status: "PUBLISHED", reviewStatus: "APPROVED" };
const bazar: HubBazarItem = { id: "b", title: "Libro", kind: "LIBRO", tx: "VENTA", priceCents: 100, status: "AVAILABLE", reviewStatus: "APPROVED" };

describe("isActiveListing", () => {
  it("acepta publicaciones aprobadas y el bazar disponible", () => {
    expect(isActiveListing(document, "document")).toBe(true);
    expect(isActiveListing(bazar, "bazar")).toBe(true);
  });

  it("mantiene compatibilidad si falta reviewStatus", () => {
    expect(isActiveListing({ ...document, reviewStatus: undefined }, "document")).toBe(true);
  });

  it("excluye publicaciones pausadas por marca o fecha", () => {
    expect(isActiveListing({ ...document, paused: true }, "document")).toBe(false);
    expect(isActiveListing({ ...bazar, pausedAt: "2026-01-01" }, "bazar")).toBe(false);
  });

  it("cuenta una activa y omite una pausada en el contador compartido", () => {
    const documents = [document, { ...document, id: "paused", pausedAt: "2026-01-01" }];
    const bazarItems: HubBazarItem[] = [];
    const active = documents.filter((item) => isActiveListing(item, "document")).length
      + bazarItems.filter((item) => isActiveListing(item, "bazar")).length;
    expect(active).toBe(1);
  });

  it("excluye publicaciones retiradas y retiros heredados", () => {
    expect(isActiveListing({ ...document, removed: true }, "document")).toBe(false);
    expect(isActiveListing({ ...bazar, removedAt: "2026-01-01" }, "bazar")).toBe(false);
    expect(isActiveListing({ ...document, status: "TAKEDOWN" }, "document")).toBe(false);
  });

  it("excluye revisión pendiente o rechazada", () => {
    expect(isActiveListing({ ...document, reviewStatus: "PENDING" }, "document")).toBe(false);
    expect(isActiveListing({ ...bazar, reviewStatus: "REJECTED" }, "bazar")).toBe(false);
  });

  it("excluye estados distintos de publicado o disponible", () => {
    expect(isActiveListing({ ...document, status: "DRAFT" }, "document")).toBe(false);
    expect(isActiveListing({ ...bazar, status: "SOLD" }, "bazar")).toBe(false);
  });
});
