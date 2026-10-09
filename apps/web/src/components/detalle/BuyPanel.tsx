import { pen } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import { CareerAvatar } from "../CareerVisual";
import { todayLocal, type Detail } from "./useDetail";

// Panel de compra: vendedor, precio con desglose real, cobro, fechas de alquiler y CTA.
export function BuyPanel({ d }: { d: Detail }) {
  const p = d.person;
  const isBazar = !!d.item;
  const cta = !d.available ? "No disponible" : d.busy ? "Creando pedido…" : !d.loggedIn ? "Entrar y comprar" : isBazar ? (d.isRental ? "Solicitar alquiler" : "Solicitar compra") : "Comprar ahora";
  return (
    <aside className="flex flex-col gap-4">
      <div className="card flex flex-col gap-4 p-6">
        <h1 className="h-display text-2xl">{d.src?.title}</h1>
        <div className="flex items-center gap-3">
          <CareerAvatar name={p?.fullName ?? "?"} className="h-11 w-11" />
          <div className="text-sm">
            <p className="font-bold text-zinc-950">{p?.fullName ??"Vendedor UNSA"}</p>
            <p className="text-zinc-500">{[p?.career ? careerLabel(p.career) : null, p?.cycle ? `Ciclo ${p.cycle}` : null].filter(Boolean).join(" · ") ||"Comunidad UNSA"}</p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Precio total</span>

          </div>
          <p className="price mt-1 text-4xl text-primary">{pen(d.quote.amountCents)}</p>
          <p className="mt-2 text-xs text-zinc-600">El comprador paga el precio publicado; el vendedor recibe el 87 % (comisión del 13 %).</p>
        </div>
        <p className="text-sm text-zinc-600">{isBazar ? "Paga al equipo al recoger en sede, después de revisar el artículo." : "Elige una cuenta del equipo en checkout y adjunta la foto del comprobante."}</p>
        {d.isRental && d.available && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700">
              Inicio del alquiler
              <input type="date" className="input" value={d.rental.start} min={todayLocal()} max={d.rental.end || undefined} onChange={(e) => d.setRental((r) => ({ ...r, start: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700">
              Fin del alquiler
              <input type="date" className="input" value={d.rental.end} min={d.rental.start || todayLocal()} onChange={(e) => d.setRental((r) => ({ ...r, end: e.target.value }))} />
            </label>
            <p className="col-span-2 text-xs text-zinc-500">El vendedor debe aceptar tu solicitud antes de que pagues.</p>
          </div>
        )}
        <p role="alert" className="min-h-[1rem] text-sm font-bold text-[#b91c1c]">{d.err}</p>
        <button type="button" disabled={!d.available || d.busy} onClick={d.buy} className="btn btn-primary btn-lg w-full">{cta}</button>
        <p className="text-center text-xs text-zinc-500">El equipo verifica el pago y liquida al vendedor en 24–48 h.</p>
      </div>
      <ul className="card-dashed flex flex-col gap-2 p-5 text-sm text-zinc-700">
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">lock</span>{isBazar ? "El vendedor tiene 48 h para responder." : "Reserva de 30 minutos mientras pagas."}</li>
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">gavel</span>Reportes D.L. 822 atendidos en menos de 48 horas.</li>
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">verified_user</span>Solo cuentas @unsa.edu.pe.</li>
      </ul>
    </aside>
  );
}
