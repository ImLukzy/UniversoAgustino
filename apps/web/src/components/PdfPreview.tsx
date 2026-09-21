import { useEffect, useRef, useState, type ReactNode } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// Renderiza UNA página real del PDF en canvas. Si falla, muestra el respaldo.
export function PdfPage({ url, page, fallback, scale = 1.5 }: { url: string; page: number; fallback?: ReactNode; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void (async () => {
      const task = pdfjsLib.getDocument({ url, withCredentials: false });
      try {
        const doc = await task.promise;
        if (cancelled) {
          await task.destroy();
          return;
        }
        if (page < 1 || page > doc.numPages) {
          await task.destroy();
          if (!cancelled) {
            setFailed(true);
            setLoading(false);
          }
          return;
        }
        const pg = await doc.getPage(page);
        if (cancelled) {
          await task.destroy();
          return;
        }
        const viewport = pg.getViewport({ scale });
        const canvas = ref.current;
        if (!canvas) {
          await task.destroy();
          return;
        }
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await pg.render({ canvas, viewport }).promise;
        await task.destroy();
        if (!cancelled) setLoading(false);
      } catch {
        try {
          await task.destroy();
        } catch {
          /* noop */
        }
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, page, scale]);

  if (failed) return <>{fallback ?? null}</>;
  return (
    <div className="relative bg-white">
      {loading && (
        <div className="flex items-center justify-center gap-2 bg-slate-100 py-16 text-xs text-slate-400">
          <span className="material-symbols-outlined animate-spin text-lg">sync</span>
          Cargando página {page}…
        </div>
      )}
      <canvas ref={ref} className="h-auto w-full" />
    </div>
  );
}

const IMG_EXT = /\.(png|jpe?g|webp|gif)$/i;
const PDF_EXT = /\.pdf$/i;

// Muestra contenido real del archivo: PDF (página indicada), imagen directa,
// o imagen de carrera si no hay archivo.
export function PagePreview({
  fileUrl, page, careerImg, title, scale = 1.5, imgClassName = "h-auto w-full object-contain bg-white",
}: {
  fileUrl?: string | null;
  page: number;
  careerImg: string;
  title: string;
  scale?: number;
  imgClassName?: string;
}) {
  const clean = (fileUrl ?? "").split("?")[0];
  const careerFallback = <img src={careerImg} alt={title} loading="lazy" className="h-auto w-full object-cover" />;
  if (!fileUrl) return careerFallback;
  if (IMG_EXT.test(clean)) {
    return <img src={fileUrl} alt={`${title} (página ${page})`} loading="lazy" className={imgClassName} />;
  }
  if (PDF_EXT.test(clean)) {
    return <PdfPage url={fileUrl} page={page} scale={scale} fallback={careerFallback} />;
  }
  return careerFallback;
}
