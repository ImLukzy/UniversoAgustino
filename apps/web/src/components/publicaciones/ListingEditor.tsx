import { useState, type ChangeEvent } from "react";
import type { PayMethod } from "../../lib/api";
import { useCareerTheme } from "../../live/careerTheme";
import { PhotoManager } from "../PhotoManager";
import { PayFields } from "./PayFields";
import { EditorActions } from "./EditorActions";
import { useListingEditor } from "./useListingEditor";
import type { Listing } from "./listing";
import { SamplePagesField, samplePages } from "../SamplePagesField";
import { formatPageRange } from "@hub/shared";

// Editor en línea de una publicación propia. Apuntes: título, curso, ciclo,
// precio, descripción y cobro. Bazar: título, precio, descripción, fotos y cobro
// (kind/tx/carrera no se editan: los fija el backend).
export function ListingEditor({ listing, liveOrders, onDone }: { listing: Listing; liveOrders: number; onDone: () => void }) {
  const { accent } = useCareerTheme();
  const isDoc = listing.kind === "doc";
  const src = isDoc ? listing.doc : listing.item;
  const ed = useListingEditor(isDoc ? `/documents/${src.id}` : `/bazar/${src.id}`, isDoc ? "docs-mine" : "bazar-mine", onDone);
  const [f, setF] = useState({
    title: src.title,
    course: isDoc ? listing.doc.course : "",
    cycle: isDoc ? listing.doc.cycle : "",
    soles: String(src.priceCents / 100),
    description: src.description ?? "",
    payMethod: (src.payMethod ?? "YAPE") as PayMethod,
    payDetail: src.payDetail ?? "",
    payQrUrl: src.payQrUrl ?? "",
    samples: isDoc ? formatPageRange(listing.doc.previewPages ?? [1, 2]) : "",
  });
  const [photos, setPhotos] = useState<string[]>(isDoc ? [] : (listing.item.photos ?? []));
  const set = (k: keyof typeof f) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const priceCents = Math.round(Number(f.soles) * 100);

  const save = () =>
    ed.save({
      title: f.title.trim(),
      ...(isDoc ? { course: f.course.trim(), cycle: f.cycle.trim(), ...(samplePages(f.samples) ? { previewPages: samplePages(f.samples) } : {}) } : { photos }),
      priceCents,
      description: f.description.trim() || null,
      payMethod: f.payMethod,
      payDetail: f.payDetail.trim() || null,
      payQrUrl: f.payQrUrl || null,
    });

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className={`grid grid-cols-1 gap-3 ${isDoc ? "sm:grid-cols-[2fr_1fr_1fr_1fr]" : "sm:grid-cols-[3fr_1fr]"}`}>
        <input aria-label="Título" className="input font-bold" value={f.title} onChange={set("title")} placeholder="Título" />
        {isDoc && <input aria-label="Curso" className="input" value={f.course} onChange={set("course")} placeholder="Curso" />}
        {isDoc && <input aria-label="Ciclo" className="input" value={f.cycle} onChange={set("cycle")} placeholder="Ciclo (I, II…)" />}
        <input aria-label="Precio en soles" className="input" type="number" min={0} value={f.soles} onChange={set("soles")} placeholder="Precio S/" />
      </div>
      {isDoc && <SamplePagesField id={`samples-${src.id}`} className="sm:max-w-xs" value={f.samples} onChange={(v) => setF((s) => ({ ...s, samples: v }))} />}
      <textarea aria-label="Descripción" className="input" rows={2} value={f.description} onChange={set("description")} placeholder="Descripción" />
      {!isDoc && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-600">Fotos del producto (máx. 4)</span>
          <PhotoManager value={photos} onChange={setPhotos} accentColor={accent?.color ?? null} />
        </div>
      )}
      <PayFields
        method={f.payMethod}
        detail={f.payDetail}
        qr={f.payQrUrl}
        onMethod={(v) => setF((s) => ({ ...s, payMethod: v }))}
        onDetail={(v) => setF((s) => ({ ...s, payDetail: v }))}
        onQr={(v) => setF((s) => ({ ...s, payQrUrl: v }))}
      />
      <EditorActions ed={ed} title={src.title} liveOrders={liveOrders} oldPrice={src.priceCents} newPrice={priceCents} onSave={save} />
    </div>
  );
}
