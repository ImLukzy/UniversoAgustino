import { PLATFORM_FEE_PCT } from "@hub/shared";
import { pen } from "../../lib/api";
import { fieldLabel } from "./StepDetails";
import type { PublishForm } from "./usePublishForm";
import { SamplePagesField } from "../SamplePagesField";

const DECLARATIONS = [
  "Declaro que este material es de mi autoría y no contiene exámenes oficiales ni escaneos de libros protegidos (D.L. 822).",
  "Confirmo que los datos de terceros están anonimizados: sin nombres, DNI ni datos identificables (Ley N° 29733).",
  `Acepto la comisión del ${PLATFORM_FEE_PCT}% y el retiro del material si se reporta una infracción fundada.`,
];

// Paso 3 (precio con desglose real de computePrice) y paso 4 (declaración jurada).
export function StepPriceLegal({ form }: { form: PublishForm }) {
  const { quote } = form;
  return (
    <>
      <section className="card flex flex-col gap-4 p-6">
        <h2 className="text-lg font-extrabold text-zinc-950">3 · Precio y ganancia</h2>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <label className={fieldLabel}>
            Precio de venta (S/)
            <input className="input price h-12 text-xl" type="number" min={0} max={500} step={1} value={form.f.price} onChange={(e) => form.set("price", Number(e.target.value))} />
            <span className="text-xs font-normal text-zinc-500">Sugerido: {pen(form.cc.suggestPrice * 100)}</span>
          </label>
          <dl className="rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm">
            <div className="flex justify-between py-1"><dt className="text-zinc-600">Precio pagado</dt><dd className="font-bold">{pen(quote.amountCents)}</dd></div>
            <div className="flex justify-between py-1"><dt className="text-zinc-600">Comisión ({PLATFORM_FEE_PCT}%)</dt><dd className="font-bold text-[#b91c1c]">− {pen(quote.feeCents)}</dd></div>
            <div className="mt-1 flex items-baseline justify-between border-t border-zinc-900 pt-2"><dt className="font-bold">Tu ganancia</dt><dd className="price text-2xl text-primary">{pen(quote.netCents)}</dd></div>
          </dl>
        </div>
        {form.mode === "digital" && <SamplePagesField id="publish-samples" className="md:max-w-xs" value={form.f.samples} onChange={(v) => form.set("samples", v)} />}
      </section>
      <section className="card flex flex-col gap-3 p-6">
        <h2 className="text-lg font-extrabold text-zinc-950">4 · Declaración jurada (D.L. 822)</h2>
        {DECLARATIONS.map((d, i) => (
          <label key={d} className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
            <input type="checkbox" checked={form.checks[i]} onChange={(e) => form.setChecks((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span>{d}</span>
          </label>
        ))}
      </section>
    </>
  );
}
