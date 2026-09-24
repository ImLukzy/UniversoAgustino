import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { SPRING } from "../../lib/motion";
import { stampWatermark } from "../../lib/watermark";
import { usePdf } from "./usePdf";
import { pageSegments, rangeLabel } from "./pageSegments";

// Hoja A4 vacía idéntica a la final (CLS ≈ 0).
export function SheetSkeleton() {
  return <div aria-hidden="true" className="aspect-[1/1.414] w-full animate-pulse sheet" />;
}

interface SheetProps {
  doc: PDFDocumentProxy;
  index: number;
  page: number;
  ratio: number;
  watermark: string;
}

// Una página: se pinta solo al acercarse al viewport y la marca de agua se
// quema en el mismo canvas justo después.
function PdfSheet({ doc, index, page, ratio, watermark }: SheetProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | null = null;
    let alive = true;
    void doc.getPage(index).then((pg) => {
      const c = canvas.current;
      if (!alive || !c) return;
      const viewport = pg.getViewport({ scale: 1.5 });
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);
      task = pg.render({ canvas: c, viewport });
      task.promise.then(() => alive && stampWatermark(c, watermark)).catch(() => {});
    });
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [visible, doc, index, watermark]);

  return (
    <motion.div
      ref={box}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "200px" }}
      transition={SPRING}
      className="relative w-full select-none overflow-hidden sheet"
      style={{ aspectRatio: `1 / ${ratio}` }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <canvas ref={canvas} aria-label={`Página ${page}`} className="absolute inset-0 h-full w-full" />
      <span className="absolute bottom-2 right-2 rounded bg-white/90 px-1.5 text-[11px] font-bold text-zinc-500">{page}</span>
    </motion.div>
  );
}

interface Props {
  url: string;
  fullAccess: boolean;
  watermark: string;
  fallback: ReactNode;
  // Rango bloqueado ("3–7"); compact = bloqueos posteriores al primero.
  paywall: (range: string, compact: boolean, ratio: number) => ReactNode;
}

export function PdfPages({ url, fullAccess, watermark, fallback, paywall }: Props) {
  const { doc, ratio, failed, pages, total } = usePdf(url, !fullAccess);
  if (failed) return <>{fallback}</>;
  if (!doc) {
    return (
      <div role="status" aria-label="Cargando documento" className="space-y-6">
        <SheetSkeleton />
        <SheetSkeleton />
      </div>
    );
  }
  const segments = pageSegments(pages, fullAccess ? pages.length : total);
  const firstLock = segments.findIndex((s) => s.kind === "locked");
  return (
    <div className="space-y-6">
      {segments.map((s, i) =>
        s.kind === "page" ? (
          <PdfSheet key={`p${s.page}`} doc={doc} index={s.index} page={s.page} ratio={ratio} watermark={watermark} />
        ) : (
          <div key={`l${s.from}`}>{paywall(rangeLabel(s.from, s.to), i !== firstLock, ratio)}</div>
        ),
      )}
    </div>
  );
}
