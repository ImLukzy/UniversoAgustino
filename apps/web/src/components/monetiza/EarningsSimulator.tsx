import { useState } from "react";
import { PLATFORM_FEE_PCT, simulateEarnings } from "@hub/shared";
import type { CareerContent } from "../../data/career/types";

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

function Slider({ id, label, value, display, min, max, step, onChange, hint }: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-bold text-zinc-900">{label}</label>
        <span className="tag bg-primary-soft text-sm normal-case tracking-normal">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-3 w-full accent-primary" />
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

// Calculadora local (misma función pura que la API: simulateEarnings) — sin red, sin saltos.
export function EarningsSimulator({ cc, careerLabel }: { cc: CareerContent; careerLabel?: string }) {
  const [kind, setKind] = useState<"digital" | "fisico">("digital");
  const [price, setPrice] = useState(cc.suggestPrice);
  const [sales, setSales] = useState(cc.suggestSales);
  const sim = simulateEarnings({ avgPrice: price, salesPerMonth: sales, bazarExtra: 0, feePct: PLATFORM_FEE_PCT });
  const equiv = sim.net < 250 ? cc.equivLow : sim.net < 600 ? cc.equivMid : cc.equivHigh;
  const kinds = [
    { id: "digital" as const, icon: "description", title: cc.resDigitalTitle, ex: cc.digitalEx },
    { id: "fisico" as const, icon: "storefront", title: cc.resFisicoTitle, ex: cc.fisicoEx },
  ];

  return (
    <section id="simulador" className="scroll-mt-6 mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <p className="eyebrow">Simulador transparente</p>
      <h2 className="h-display mt-2 text-3xl sm:text-4xl">Calcula tu retorno por ciclo</h2>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-12">
        <div className="card flex flex-col gap-8 p-6 sm:p-8 lg:col-span-7">
          <div role="radiogroup" aria-label="Tipo de recurso" className="grid gap-3 sm:grid-cols-2">
            {kinds.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${kind === k.id ? "border-zinc-900 bg-primary-soft" : "border-zinc-200 hover:border-zinc-400"}`}
              >
                <span className="material-symbols-outlined text-primary">{k.icon}</span>
                <span>
                  <span className="block font-bold text-zinc-900">{k.title}</span>
                  <span className="text-sm text-zinc-600">{k.ex}</span>
                </span>
              </button>
            ))}
          </div>
          <Slider id="price" label="Precio de venta" value={price} display={soles(price)} min={5} max={50} step={1} onChange={setPrice} hint={`Sugerido${careerLabel ? ` en ${careerLabel}` : ""}: S/ ${cc.suggestPrice}.00`} />
          <Slider id="sales" label="Ventas por ciclo" value={sales} display={`${sales} ventas`} min={10} max={200} step={5} onChange={setSales} hint={`Promedio sugerido: ${cc.suggestSales}`} />
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
            <b className="text-zinc-900">{kind === "digital" ? cc.feeDigitalTitle : cc.feeFisicoTitle}.</b>{" "}
            {kind === "digital" ? `La plataforma retiene el ${PLATFORM_FEE_PCT}% para almacenamiento, moderación y custodia del pago.` : cc.feeFisicoBody}
          </p>
        </div>
        <div className="card bg-zinc-900 p-6 text-white sm:p-8 lg:col-span-5" aria-live="polite">
          <p className="eyebrow text-zinc-400">Tu ganancia neta estimada</p>
          <p className="price mt-3 text-5xl">{soles(sim.net)}</p>
          <dl className="mt-6 space-y-2 border-y border-dashed border-white/25 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-400">Monto bruto</dt><dd className="font-bold">{soles(sim.gross)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-400">Comisión ({PLATFORM_FEE_PCT}%)</dt><dd className="font-bold text-[#fca5a5]">− {soles(sim.fee)}</dd></div>
          </dl>
          <p className="mt-4 text-sm font-bold text-zinc-300">¿Qué cubre en Arequipa?</p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
            {equiv.map((e) => (
              <li key={e} className="flex gap-2"><span className="material-symbols-outlined text-base text-[#dcfc6b]">check_circle</span>{e}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
