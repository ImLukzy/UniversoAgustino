import { useEffect, useRef, useState, type ReactNode } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// Renderiza UNA página real del PDF en canvas. Si falla, muestra el respaldo.
// Los bytes viajan por la API (?stream=1, mismo origen efectivo) en lugar
// de un fetch directo a R2: así no dependen del CORS del bucket, de
// preflights ni de bloqueadores del navegador.
function PdfPage({ url, page, fallback, scale = 1.5 }: { url: string; page: number; fallback?: ReactNode; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const streamUrl = url.includes("?") ? `${url}&stream=1` : `${url}?stream=1`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void (async () => {
      const task = pdfjsLib.getDocument({ url: streamUrl, withCredentials: false });
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
  }, [url, streamUrl, page, scale]);

  if (failed) return <>{fallback ?? null}</>;
  // El canvas queda oculto hasta pintarse: sin el 300×150 por defecto ni saltos.
  return (
    <div className="relative h-full min-h-full w-full bg-white">
      {loading && <div role="status" aria-label={`Cargando página ${page}`} className="absolute inset-0 animate-pulse bg-zinc-100" />}
      <canvas ref={ref} className={`h-auto w-full ${loading ? "invisible" : ""}`} />
    </div>
  );
}

const IMG_EXT = /\.(png|jpe?g|webp|gif)$/i;
const PDF_EXT = /\.pdf$/i;

// Sin archivo o si falla: icono neutro. Nunca un <img src=""> (el navegador
// pintaba el alt, p. ej. "API RESTful", sobre gris).
function NoPreview({ title }: { title: string }) {
  return (
    <span role="img" aria-label={`${title}: sin vista previa`} className="flex h-full min-h-32 w-full items-center justify-center bg-zinc-100 text-zinc-400">
      <span className="material-symbols-outlined text-4xl" aria-hidden="true">description</span>
    </span>
  );
}

function ImgPreview({ src, alt, className, fallback }: { src: string; alt: string; className: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}

// Muestra contenido real del archivo: PDF (página indicada), imagen directa,
// o imagen de carrera (si se pasa) cuando no hay archivo.
export function PagePreview({
  fileUrl, src, kind, page, careerImg, title, scale = 1.5, imgClassName = "h-auto w-full object-contain bg-white",
}: {
  fileUrl?: string | null;
  // URL a pedir si difiere de fileUrl (vista previa de pago, spec 15); el tipo sale de fileUrl.
  src?: string;
  // Tipo conocido (p. ej. fileType del detalle) cuando la URL no lleva extensión.
  kind?: "pdf" | "image" | null;
  page: number;
  careerImg?: string;
  title: string;
  scale?: number;
  imgClassName?: string;
}) {
  const clean = (fileUrl ?? "").split("?")[0];
  const careerFallback = careerImg ? <img src={careerImg} alt={title} loading="lazy" className="h-auto w-full object-cover" /> : <NoPreview title={title} />;
  if (!fileUrl) return careerFallback;
  if (kind === "image" || (!kind && IMG_EXT.test(clean))) {
    return <ImgPreview src={src ?? fileUrl} alt={`${title} (página ${page})`} className={imgClassName} fallback={careerFallback} />;
  }
  if (kind === "pdf" || (!kind && PDF_EXT.test(clean))) {
    return <PdfPage url={src ?? fileUrl} page={page} scale={scale} fallback={careerFallback} />;
  }
  return careerFallback;
}
