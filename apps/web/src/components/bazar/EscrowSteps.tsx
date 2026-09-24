import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";

// Flujo real de pedidos del bazar (máquina de estados de @hub/shared):
// reserva → pago al vendedor → custodia → liberación.
const STEPS = [
  { icon: "lock_clock", title: "Reserva", body: "Reservas el artículo por 30 minutos; nadie más puede tomarlo mientras pagas." },
  { icon: "qr_code_scanner", title: "Pago con constancia", body: "Pagas al Yape o Plin del vendedor y subes tu número de operación o captura." },
  { icon: "shield_person", title: "Custodia", body: "El vendedor confirma el abono y el pedido pasa a custodia hasta la entrega." },
  { icon: "task_alt", title: "Entrega y liberación", body: "Revisas el artículo en persona y confirmas la recepción; recién ahí se cierra la venta." },
];

export function EscrowSteps({ spots, times }: { spots: readonly string[]; times: readonly string[] }) {
  return (
    <section className="border-y-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="eyebrow">Compra protegida</p>
        <h2 className="h-display mt-2 max-w-3xl text-3xl sm:text-4xl">Así funciona la custodia de tu pedido</h2>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <span className="flex items-center justify-between">
                <span className="material-symbols-outlined text-3xl text-primary theme-transition">{s.icon}</span>
                <span className="price text-2xl text-zinc-300">{i + 1}</span>
              </span>
              <h3 className="mt-4 font-extrabold text-zinc-950">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card-dashed flex items-start gap-3 p-5">
            <span className="material-symbols-outlined text-2xl text-zinc-900">help_center</span>
            <p className="text-sm leading-relaxed text-zinc-700">
              ¿El artículo no coincide con las fotos? No confirmes la recepción y repórtalo desde tu pedido.{" "}
              <Link to={ROUTES.legal} className="font-bold text-zinc-950 underline">Ver términos</Link>
            </p>
          </div>
          <ul className="card divide-y divide-dashed divide-zinc-300" aria-label="Puntos de encuentro sugeridos">
            {spots.map((spot, i) => (
              <li key={spot} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="flex items-center gap-2 font-bold text-zinc-900">
                  <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                  {spot}
                </span>
                <span className="text-zinc-500">{times[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
