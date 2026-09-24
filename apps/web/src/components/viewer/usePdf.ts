import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { authHeaders } from "../../lib/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export const A4 = 1.414;

export interface PdfState {
  doc: PDFDocumentProxy | null;
  ratio: number;
  failed: boolean;
  // Número real de cada página del PDF servido (la muestra puede ser 2, 5, 9…).
  pages: number[];
  total: number;
}

const EMPTY: PdfState = { doc: null, ratio: A4, failed: false, pages: [], total: 0 };
const nums = (h: string | null) => (h ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);

// Carga el PDF UNA vez. Completo: stream same-origin con Range. Muestra (spec
// 16): PDF pequeño del servidor; sus cabeceras dicen qué páginas reales trae y
// cuántas tiene el original, para cubrir el resto con el muro. pdf.js sin XFA
// ni capa de texto: el contenido solo existe como píxeles en <canvas>.
export function usePdf(url: string, preview: boolean): PdfState {
  const [state, setState] = useState<PdfState>(EMPTY);
  useEffect(() => {
    let alive = true;
    let task: ReturnType<typeof pdfjsLib.getDocument> | null = null;
    const open = async () => {
      let meta = { pages: [] as number[], total: 0 };
      if (preview) {
        const r = await fetch(url, { headers: authHeaders() });
        if (!r.ok) throw new Error(`preview ${r.status}`);
        meta = { pages: nums(r.headers.get("X-Preview-Pages")), total: Number(r.headers.get("X-Total-Pages")) || 0 };
        task = pdfjsLib.getDocument({ data: new Uint8Array(await r.arrayBuffer()), enableXfa: false });
      } else {
        task = pdfjsLib.getDocument({ url: `${url}?stream=1`, enableXfa: false, withCredentials: false, httpHeaders: authHeaders() });
      }
      const doc = await task.promise;
      const vp = (await doc.getPage(1)).getViewport({ scale: 1 });
      const all = Array.from({ length: doc.numPages }, (_, i) => i + 1);
      const pages = meta.pages.length === doc.numPages ? meta.pages : all;
      const total = Math.max(meta.total, pages[pages.length - 1] ?? 0);
      if (alive) setState({ doc, ratio: vp.height / vp.width, failed: false, pages, total });
    };
    open().catch(() => alive && setState((s) => ({ ...s, failed: true })));
    return () => {
      alive = false;
      void task?.destroy();
    };
  }, [url, preview]);
  return state;
}
