import { describe, expect, it } from "vitest";
import { batchTitleIssue, isBatch, partialMessage, queueUploaded, titleFromFile, titleOk } from "./uploadQueue";

const item = (name: string, title: string) => ({ title, file: { name } });

describe("cola de archivos de /publicar (lote)", () => {
  it("propone el título a partir del nombre del archivo", () => {
    expect(titleFromFile("Farmaco_parcial-2024.pdf")).toBe("Farmaco parcial 2024");
    expect(titleFromFile("  resumen   final .v2.PDF")).toBe("resumen final .v2");
    expect(titleFromFile("x".repeat(200) + ".pdf")).toHaveLength(160);
  });

  it("un lote empieza en 2 archivos", () => {
    expect(isBatch([1])).toBe(false);
    expect(isBatch([1, 2])).toBe(true);
  });

  it("solo está listo cuando todos subieron sin error", () => {
    expect(queueUploaded([])).toBe(false);
    expect(queueUploaded([{ url: "/uploads/a.pdf", failed: null }, { url: null, failed: null }])).toBe(false);
    expect(queueUploaded([{ url: "/uploads/a.pdf", failed: "Error" }])).toBe(false);
    expect(queueUploaded([{ url: "/uploads/a.pdf", failed: null }, { url: "/uploads/b.pdf", failed: null }])).toBe(true);
  });

  it("exige título de 4+ caracteres por archivo y señala cuál falla", () => {
    expect(titleOk(" abc ")).toBe(false);
    expect(batchTitleIssue([item("a.pdf", "Anatomía"), item("b.pdf", "ok")])).toBe('El título de "b.pdf" necesita al menos 4 caracteres.');
    expect(batchTitleIssue([item("a.pdf", "Anatomía"), item("b.pdf", "Fisiología")])).toBeNull();
  });

  it("informa la publicación parcial del lote", () => {
    expect(partialMessage(0, 3, "Sin conexión")).toBe("Sin conexión");
    expect(partialMessage(2, 3, "Sin conexión")).toBe("Se publicaron 2 de 3. Los restantes siguen en la lista: Sin conexión");
  });
});
