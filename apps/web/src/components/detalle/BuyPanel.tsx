import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { pen } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import { PAY_LABEL } from "../../lib/payments";
import { SPRING } from "../../lib/motion";
import { CareerAvatar } from "../CareerVisual";
import { todayLocal, type Detail } from "./useDetail";

// Panel de compra: vendedor, precio con desglose real, cobro, fechas de alquiler y CTA.
export function BuyPanel({ d }: { d: Detail }) {
  const [showFee, setShowFee] = useState(false);
  const p = d.person;
  const cta = !d.available ? "No disponible" : d.busy ? "Creando pedido…" : !d.loggedIn ? "Entrar y comprar" : d.isRental ? "Solicitar alquiler" : "Comprar ahora";
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
            <button type="button" onClick={() => setShowFee((v) => !v)} aria-expanded={showFee} className="flex items-center gap-0.5 text-xs font-bold text-zinc-600 hover:text-zinc-950">
              <span className="material-symbols-outlined text-sm">info</span>Comisión {PLATFORM_FEE_PCT}%
            </button>
          </div>
          <p className="price mt-1 text-4xl text-primary">{pen(d.quote.amountCents)}</p>
          <AnimatePresence initial={false}>
            {showFee && (
              <motion.dl initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="overflow-hidden text-xs">
                <div className="mt-3 flex justify-between border-t border-dashed border-zinc-300 pt-2"><dt className="text-zinc-500">Comisión plataforma</dt><dd className="font-bold">−{pen(d.quote.feeCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-zinc-500">Neto para el vendedor</dt><dd className="font-bold">{pen(d.quote.netCents)}</dd></div>
                <p className="mt-1 text-zinc-500">La comisión la asume el vendedor: tú pagas el precio publicado.</p>
              </motion.dl>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-start gap-3 text-sm">
          {d.payQr ? <img src={d.payQr} alt="QR de cobro del vendedor" className="h-24 w-24 rounded-lg border-2 border-zinc-900 object-cover" /> : null}
          <div>
            <p className="font-bold text-zinc-950">Cobro por {PAY_LABEL[d.src?.payMethod ??"YAPE"]}</p>
            <p className="text-zinc-600">{d.src?.payDetail || (d.payQr ? "" :"El vendedor aún no sube su QR.")}</p>
          </div>
        </div>
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
        <p className="text-center text-xs text-zinc-500">Pagas al vendedor; el pedido queda en custodia hasta que confirmas la recepción.</p>
      </div>
      <ul className="card-dashed flex flex-col gap-2 p-5 text-sm text-zinc-700">
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">lock</span>Reserva de 30 minutos mientras pagas.</li>
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">gavel</span>Reportes D.L. 822 atendidos en menos de 48 horas.</li>
        <li className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">verified_user</span>Solo cuentas @unsa.edu.pe.</li>
      </ul>
    </aside>
  );
}
