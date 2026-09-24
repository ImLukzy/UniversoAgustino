import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { pen, previewUrl, type HubDocument } from "../lib/api";
import { careerColor } from "../data/unsa";

// PagePreview arrastra pdfjs-dist: lazy para no pagarlo en el parseo inicial.
const PagePreview = lazy(() => import("./PdfPreview").then((m) => ({ default: m.PagePreview })));

// Tarjeta de documento del dashboard (alto fijo 15.5rem = skeleton, CLS 0): portada real del PDF, título,
// curso/autor con el color de su carrera y precio real. El badge flotante
// muestra el TIPO real (APUNTE/PAE/BALOTARIO/GUIA): el backend no guarda
// número de páginas ni votos, así que "8"/"100% (10)" serían inventados.
export function DocumentCard({ doc }: { doc: HubDocument }) {
  const career = careerColor(doc.career);
  return (
    <Link
      to={`/v/${doc.id}`}
      className="card card-hover group flex h-[15.5rem] w-48 cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative h-32 overflow-hidden border-b-2 border-zinc-900 bg-zinc-100">
        {doc.fileType ? (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-zinc-100" aria-hidden="true" />}>
            <PagePreview kind={doc.fileType} fileUrl={previewUrl(doc.id)} page={1} title={doc.title} imgClassName="h-full w-full object-cover object-top" />
          </Suspense>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-300">
            <span className="material-symbols-outlined text-4xl">description</span>
          </span>
        )}
        <span className="tag absolute bottom-1.5 right-1.5 bg-white">
          {doc.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-zinc-900 group-hover:underline">{doc.title}</p>
        <p className="truncate text-xs text-zinc-500" style={{ color: career }}>
          {doc.course}
          {doc.author?.profile?.fullName ? ` · ${doc.author.profile.fullName}` : ""}
        </p>
        {/* Variantes (spec 07): gratis = badge zinc; de pago = precio en el color de la carrera. */}
        <p className="mt-auto flex h-7 items-center gap-1 border-t border-dashed border-zinc-300 pt-2 text-sm">
          {doc.priceCents > 0 ? (
            <span className="price text-primary theme-transition">{pen(doc.priceCents)}</span>
          ) : (
            <span className="tag bg-[#dcfc6b]">Gratis</span>
          )}
        </p>
      </div>
    </Link>
  );
}
