import { UNSA_CAREERS } from "../../data/unsa";
import { BAZAR_KINDS, CYCLES } from "../../lib/publishing";
import type { PublishForm } from "./usePublishForm";

export const fieldLabel = "flex flex-col gap-1.5 text-sm font-bold text-zinc-800";

// Paso 1: datos académicos (apunte) o del artículo (bazar).
export function StepDetails({ form }: { form: PublishForm }) {
  const { f, set, mode, cc } = form;
  const digital = mode === "digital";
  return (
    <section className="card flex flex-col gap-4 p-6">
      <h2 className="text-lg font-extrabold text-zinc-950">1 · {digital ? "Información académica" : "Datos del artículo"}</h2>
      <label className={fieldLabel}>
        Título *
        <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={digital ? cc.publishTitlePh : cc.bazarTitlePh} maxLength={160} />
      </label>
      {digital ? (
        <>
          <div className={fieldLabel}>
            <span id="career-pick-label">Carrera UNSA *</span>
            <div role="radiogroup" aria-labelledby="career-pick-label" className="flex flex-wrap gap-1.5">
              {UNSA_CAREERS.map((c) => {
                const active = f.career === c.key;
                return (
                  <button key={c.key} type="button" role="radio" aria-checked={active} onClick={() => set("career", c.key)} className={`chip h-8 px-3 text-xs ${active ? "chip-active" : ""}`} style={active ? { backgroundColor: c.color } : undefined}>
                    {!active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className={fieldLabel}>
              Curso *
              <input className="input" value={f.course} onChange={(e) => set("course", e.target.value)} placeholder={cc.publishCoursePh} maxLength={100} />
            </label>
            <label className={fieldLabel}>
              Ciclo *
              <select className="input" value={f.cycle} onChange={(e) => set("cycle", e.target.value)}>
                {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={fieldLabel}>
              Tipo de material
              <select className="input" value={form.docType} onChange={(e) => set("docType", e.target.value)}>
                {form.types.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={fieldLabel}>
            Categoría
            <select className="input" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
              {BAZAR_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </label>
          <label className={fieldLabel}>
            Modalidad
            <select className="input" value={f.tx} onChange={(e) => set("tx", e.target.value as "VENTA" | "ALQUILER")}>
              <option value="VENTA">Venta</option>
              <option value="ALQUILER">Alquiler por ciclo</option>
            </select>
          </label>
          <label className={fieldLabel}>
            Punto de entrega
            <select className="input" value={f.campus} onChange={(e) => set("campus", e.target.value)}>
              {cc.bazarPlaces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className={fieldLabel}>
            Garantía S/ (solo alquiler)
            <input className="input" type="number" min={0} disabled={f.tx !== "ALQUILER"} value={f.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="Ej: 50.00" />
          </label>
        </div>
      )}
      <label className={fieldLabel}>
        Descripción
        <textarea className="input" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalla qué encontrará tu compañero…" maxLength={2000} />
      </label>
    </section>
  );
}
