import type { ReactNode } from "react";
import { CYCLES, mbOf } from "../../lib/publishing";
import type { Field, UploadItem } from "./useBulkUpload";
import { SamplePagesField } from "../SamplePagesField";

function Row({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-zinc-800">{label}</label>
      {children}
      <p role={error ? "alert" : undefined} className="min-h-[1rem] text-xs font-bold text-[#b91c1c]">{error}</p>
    </div>
  );
}

// Paso 2: ficha de datos de un archivo subido.
export function FileDetailsCard({ item, types, suggestions, onChange, onRemove }: {
  item: UploadItem;
  types: { v: string; l: string }[];
  suggestions: string[];
  onChange: (k: Field, v: string) => void;
  onRemove: () => void;
}) {
  const cls = (k: Field) => `input ${item.errors[k] ? "border-[#b91c1c]" : ""}`;
  const id = (k: Field) => `${k}-${item.id}`;
  return (
    <section className="card flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between gap-3 border-b border-dashed border-zinc-300 pb-4">
        <span className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-primary">description</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-zinc-950">{item.file.name}</span>
            <span className="text-xs text-zinc-500">{mbOf(item.file)} · UNSA</span>
          </span>
        </span>
        <button type="button" onClick={onRemove} aria-label={`Quitar ${item.file.name}`} className="btn-ghost h-9 w-9 px-0">
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </header>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Row id={id("title")} label="Título *" error={item.errors.title}>
          <input id={id("title")} className={cls("title")} value={item.title} maxLength={160} onChange={(e) => onChange("title", e.target.value)} />
        </Row>
        <Row id={id("course")} label="Asignatura *" error={item.errors.course}>
          <input id={id("course")} className={cls("course")} list={`list-${item.id}`} value={item.course} onChange={(e) => onChange("course", e.target.value)} placeholder="Nombre o código del curso" />
          <datalist id={`list-${item.id}`}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
        </Row>
        <Row id={id("type")} label="Categoría *" error={item.errors.type}>
          <select id={id("type")} className={cls("type")} value={item.type} onChange={(e) => onChange("type", e.target.value)}>
            <option value="">Elige una categoría</option>
            {types.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </Row>
        <div className="grid grid-cols-2 gap-4">
          <Row id={id("cycle")} label="Ciclo *" error={item.errors.cycle}>
            <select id={id("cycle")} className={cls("cycle")} value={item.cycle} onChange={(e) => onChange("cycle", e.target.value)}>
              <option value="">Ciclo</option>
              {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
          <Row id={id("price")} label="Precio (S/) *" error={item.errors.price}>
            <input id={id("price")} className={cls("price")} type="number" min={1} max={500} value={item.price} onChange={(e) => onChange("price", e.target.value)} placeholder="15" />
          </Row>
        </div>
      </div>
      {/.pdf$/i.test(item.file.name) && <SamplePagesField id={id("samples")} value={item.samples} onChange={(v) => onChange("samples", v)} />}
      <Row id={id("description")} label="Descripción *" error={item.errors.description}>
        <textarea id={id("description")} className={cls("description")} rows={3} value={item.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Cuéntale a tu compañero qué encontrará aquí." />
      </Row>
    </section>
  );
}
