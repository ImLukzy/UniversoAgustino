import { useState } from "react";
import type { Holiday, SaveSchedule } from "./sedeTypes";
export function HolidaysForm({ holidays, save, busy }: { holidays: Holiday[]; save: SaveSchedule; busy: boolean }) {
  const [date, setDate] = useState(""); const [reason, setReason] = useState("");
  return <section className="card flex min-w-0 flex-col gap-4 p-5"><h2 className="font-bold">Feriados · cerrado todo el día</h2>
    {holidays.length === 0 && <p className="text-sm text-zinc-600">No hay feriados configurados.</p>}
    {holidays.map((h) => <div key={h.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
      <span className="min-w-0 break-words">{h.date.slice(0, 10)} · {h.reason}</span><button type="button" disabled={busy} className="btn btn-secondary btn-sm" onClick={() => {
        if (window.confirm(`¿Quitar el feriado ${h.date.slice(0, 10)}?`)) void save("delete", `/staff/schedule/holidays/${h.id}`);
      }}>Quitar feriado</button></div>)}
    <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void save("post", "/staff/schedule/holidays", { date, reason }).then((ok) => { if (ok) { setDate(""); setReason(""); } }); }}>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Fecha<input type="date" required className="input w-full min-w-0" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Motivo<input required minLength={3} maxLength={200} className="input w-full min-w-0" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <button type="submit" disabled={busy} className="btn btn-primary self-start">Añadir feriado</button>
    </form>
  </section>;
}
