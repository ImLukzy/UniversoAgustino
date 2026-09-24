import { lazy, Suspense, useState } from "react";
import { pen, previewUrl } from "../../lib/api";
import { CareerVisual } from "../CareerVisual";
import type { Detail } from "./useDetail";

const PagePreview = lazy(() => import("../PdfPreview").then((m) => ({ default: m.PagePreview })));

// Galería (bazar) o portada bloqueada (apunte) + descripción y ficha técnica.
export function DetailMedia({ d }: { d: Detail }) {
  const [photo, setPhoto] = useState(0);
  const photos = d.item?.photos ?? [];
  const current = Math.min(photo, Math.max(0, photos.length - 1));
  const facts: [string, string][] = d.doc
    ? [["Curso", d.doc.course], ["Ciclo", d.doc.cycle], ["Tipo", d.doc.type], ["Universidad", d.doc.university]]
    : d.item
      ? [["Categoría", d.item.kind], ["Modalidad", d.item.tx], ["Garantía", d.item.depositCents ? pen(d.item.depositCents) : "—"], ["Estado", d.item.status]]
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="card overflow-hidden">
        {photos.length > 0 ? (
          <>
            <img src={photos[current]} alt={d.src?.title} className="h-80 w-full object-cover" />
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t-2 border-zinc-900 p-3">
                {photos.map((u, i) => (
                  <button key={`${u}-${i}`} type="button" onClick={() => setPhoto(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === current} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === current ? "border-zinc-900" : "border-transparent"}`}>
                    <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {d.doc?.fileType ? (
              // Portada real (página 1 de la vista previa del servidor), alto fijo: CLS 0.
              <div className="h-80 overflow-hidden bg-zinc-100">
                <Suspense fallback={<div className="h-full w-full animate-pulse bg-zinc-100" aria-hidden="true" />}>
                  <PagePreview kind={d.doc.fileType} fileUrl={previewUrl(d.doc.id)} page={1} title={d.doc.title} imgClassName="h-full w-full object-cover object-top" />
                </Suspense>
              </div>
            ) : (
              <CareerVisual className="h-64 w-full" label={d.doc ? "Vista previa del documento" : "Foto referencial del bazar"} />
            )}
            {d.doc && d.doc.priceCents > 0 && (
              <div className="flex flex-col items-center gap-2 border-t-2 border-zinc-900 p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-zinc-400">lock</span>
                <p className="font-extrabold text-zinc-950">Contenido completo bloqueado</p>
                <p className="text-sm text-zinc-600">Las páginas 1 y 2 se ven gratis en el visor; el resto se desbloquea al comprar.</p>
                <button type="button" disabled={!d.available || d.busy} onClick={d.buy} className="btn btn-primary">Desbloquear por {pen(d.quote.amountCents)}</button>
              </div>
            )}
          </>
        )}
      </div>
      <section className="card flex flex-col gap-3 p-6">
        <h2 className="text-lg font-extrabold text-zinc-950">Descripción</h2>
        <p className="text-sm leading-relaxed text-zinc-600">{d.src?.description || "El vendedor aún no agregó una descripción."}</p>
        <dl className="grid grid-cols-2 gap-3 border-t border-dashed border-zinc-300 pt-3 text-sm sm:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k}><dt className="text-xs text-zinc-500">{k}</dt><dd className="font-bold text-zinc-900">{v}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}
