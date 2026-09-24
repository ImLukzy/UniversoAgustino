import { Link } from "react-router-dom";
import { pen } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import { BAZAR_KINDS } from "../../lib/publishing";
import { ROUTES } from "../../lib/routes";
import { CareerVisual } from "../CareerVisual";
import type { PublishForm } from "./usePublishForm";

// Vista previa en vivo de la tarjeta tal como la verá el comprador.
export function PublishPreview({ form, authorName }: { form: PublishForm; authorName: string }) {
  const { f, mode } = form;
  const digital = mode === "digital";
  const typeLabel = form.types.find((t) => t.v === form.docType)?.l ?? form.docType;
  const tag = digital ? `${careerLabel(f.career)} · ${typeLabel}` : `${BAZAR_KINDS.find((k) => k.value === f.kind)?.label ?? f.kind} · ${f.tx === "VENTA" ? "Venta" : "Alquiler"}`;
  const tips = [
    "Título claro y archivo legible.",
    "Material de autoría propia, con fuentes citadas.",
    "Sin nombres de docentes ni exámenes oficiales.",
    f.payQr || f.payDetail ? "Cobro configurado: el comprador verá tu QR." : "Configura tu QR para cobrar sin demoras.",
  ];
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div className="card overflow-hidden">
        <p className="eyebrow border-b-2 border-zinc-900 px-4 py-3">Vista previa en tienda</p>
        <CareerVisual className="h-40 w-full border-b-2 border-zinc-900" />
        <div className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="tag truncate">{tag}</span>
            <span className="price text-xl text-primary">{pen(form.quote.amountCents)}</span>
          </div>
          <h3 className="line-clamp-2 font-extrabold text-zinc-950">{form.batch ? `${form.queue.items.length} apuntes${f.course.trim() ? ` de ${f.course.trim()}` : ""}` : f.title || "Tu título aparecerá aquí…"}</h3>
          <p className="line-clamp-2 text-xs text-zinc-600">{f.description || (digital ? f.course ||"Tu descripción…" : f.campus)}</p>
          <p className="border-t border-dashed border-zinc-300 pt-2 text-xs font-bold text-zinc-700">Por {authorName}</p>
        </div>
      </div>
      <div className="card flex flex-col gap-2 p-4">
        <h4 className="flex items-center gap-1 font-extrabold text-zinc-950"><span className="material-symbols-outlined text-primary">checklist_rtl</span>Antes de publicar</h4>
        <ul className="flex flex-col gap-1 text-xs text-zinc-700">
          {tips.map((t) => <li key={t} className="flex gap-1"><span className="material-symbols-outlined text-base text-primary">check_circle</span>{t}</li>)}
        </ul>
        <Link to={ROUTES.legal} className="mt-1 text-xs font-bold text-zinc-950 underline">Revisar el marco legal (D.L. 822)</Link>
      </div>
    </aside>
  );
}
