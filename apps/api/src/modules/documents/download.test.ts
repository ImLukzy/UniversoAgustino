import { expect, it, vi } from "vitest";
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { watermarkDownload } from "./download.js";
vi.mock("../../lib/prisma.js", () => ({ prisma: {} }));
it("PDF descargado conserva páginas y contiene correo del comprador", async () => {
  const original = await PDFDocument.create(); original.addPage([400, 600]); original.addPage([500, 700]);
  const bytes = await original.save(); const marked = await watermarkDownload(bytes, "buyer@unsa.edu.pe");
  const pdf = await PDFDocument.load(marked); expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPage(0).getWidth()).toBe(400); expect(pdf.getPage(1).getHeight()).toBe(700);
  for (const page of pdf.getPages()) {
    const refs = page.node.Contents() as PDFArray;
    const content = Array.from({ length: refs.size() }, (_, i) => {
      const stream = pdf.context.lookup(refs.get(i)) as PDFRawStream;
      return new TextDecoder().decode(decodePDFRawStream(stream).decode());
    }).join("");
    expect(content).toContain(Buffer.from("buyer@unsa.edu.pe").toString("hex").toUpperCase());
  }
});
