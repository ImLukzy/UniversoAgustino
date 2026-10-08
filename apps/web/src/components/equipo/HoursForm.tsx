import { useState } from "react";
import { DAYS, timeMinutes, timeText, type Hours, type SaveSchedule } from "./sedeTypes";
export function HoursForm({ hours, save, busy }: { hours: Hours[]; save: SaveSchedule; busy: boolean }) {
  const [day, setDay] = useState(1); const [opens, setOpens] = useState(timeText(hours.find((h) => h.weekday === 1)?.opens ?? 480)); const [closes, setCloses] = useState(timeText(hours.find((h) => h.weekday === 1)?.closes ?? 1080)); const [special, setSpecial] = useState(hours.find((h) => h.weekday === 1)?.special ?? false);
  function select(weekday: number) { const h = hours.find((v) => v.weekday === weekday); setDay(weekday);
    setOpens(timeText(h?.opens ?? 480)); setCloses(timeText(h?.closes ?? (weekday === 6 ? 780 : 1080))); setSpecial(h?.special ?? weekday === 6); }
  return <section className="card flex min-w-0 flex-col gap-4 p-5"><h2 className="font-bold">Horario hábil · America/Lima</h2>
    <ul className="flex flex-col gap-1 text-sm">{DAYS.map((label, weekday) => { const h = hours.find((v) => v.weekday === weekday);
      return <li key={label}>{label}: {h ? `${timeText(h.opens)}–${timeText(h.closes)}${h.special ? " (especial)" : ""}` : "Cerrado"}</li>; })}</ul>
    <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void save("put", `/staff/schedule/hours/${day}`, { opens: timeMinutes(opens), closes: timeMinutes(closes), special }); }}>
      <label className="flex flex-col gap-1 text-sm">Día<select className="input w-full" value={day} onChange={(e) => select(Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="flex min-w-0 flex-col gap-1 text-sm">Apertura<input type="time" required className="input w-full min-w-0" value={opens} onChange={(e) => setOpens(e.target.value)} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Cierre<input type="time" required className="input w-full min-w-0" value={closes} onChange={(e) => setCloses(e.target.value)} /></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} />Horario especial</label>
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy} className="btn btn-primary">Guardar horario</button>
      <button type="button" disabled={busy || !hours.some((h) => h.weekday === day)} className="btn btn-secondary" onClick={() => {
        if (window.confirm(`¿Cerrar ${DAYS[day]}?`)) void save("delete", `/staff/schedule/hours/${day}`);
      }}>Cerrar día</button></div>
    </form>
  </section>;
}
