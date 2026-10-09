import { KIND_LABEL, STATUS_CLASS, STATUS_LABEL, dayName, hhmm, limaDate, limaMinute, type Agenda, type AgendaAppt } from "./agendaTypes";

const SLOT = 15, ROW_PX = 22;
function label(a: AgendaAppt) { return `${hhmm(limaMinute(a.startsAt))} ${KIND_LABEL[a.kind] ?? a.kind} · ${STATUS_LABEL[a.status] ?? a.status}`; }
function Item({ a, onOpen }: { a: AgendaAppt; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} title={`${a.itemTitle} — ${a.party}`}
    className={`h-full w-full min-w-0 overflow-hidden rounded border-l-4 px-1 text-left text-xs leading-tight ${STATUS_CLASS[a.status] ?? ""}`}>
    <span className="block truncate font-bold">{label(a)}</span><span className="block truncate">{a.staff.name} · {a.sede.name}</span></button>;
}
// Escritorio: semana lun–sáb × franjas de 15 min. Móvil: una lista por día (sin scroll horizontal).
export function AgendaGrid({ data, onOpen }: { data: Agenda; onOpen: () => void }) {
  const open = data.days.filter((d) => d.open && d.opens !== null && d.closes !== null);
  const from = Math.min(480, ...open.map((d) => d.opens ?? 480)), to = Math.max(1080, ...open.map((d) => d.closes ?? 1080));
  const rows = Math.ceil((to - from) / SLOT), row = (min: number) => Math.floor((min - from) / SLOT) + 2;
  const byDay = (date: string) => data.appointments.filter((a) => limaDate(a.startsAt) === date);
  return <>
    <div className="hidden min-h-[400px] md:block" role="table" aria-label="Agenda semanal" aria-rowcount={rows + 1} aria-colcount={7}>
      <div role="presentation" className="grid gap-px bg-zinc-200" style={{ gridTemplateColumns: "3rem repeat(6, minmax(0, 1fr))", gridTemplateRows: `2rem repeat(${rows}, ${ROW_PX}px)` }}>
        <div role="row" aria-rowindex={1} style={{ display: "contents" }}>
          <div role="columnheader" aria-colindex={1} className="sr-only">Hora</div>
          {data.days.map((d) => <div key={d.date} role="columnheader" aria-colindex={d.weekday + 1} style={{ gridColumn: d.weekday + 1, gridRow: 1 }} className="bg-white px-1 text-xs font-bold">{dayName(d.date)}</div>)}
        </div>
        {Array.from({ length: Math.ceil(rows / 4) }, (_, i) => <div key={i} aria-hidden="true" style={{ gridColumn: 1, gridRow: `${2 + i * 4} / span 4` }} className="bg-white text-xs text-zinc-600">{hhmm(from + i * 60)}</div>)}
        {open.map((d) => <div key={d.date} aria-hidden="true" style={{ gridColumn: d.weekday + 1, gridRow: `${row(d.opens!)} / ${row(d.closes!)}` }} className="bg-zinc-50" />)}
        {data.shifts.map((s, i) => <div key={i} aria-hidden="true" style={{ gridColumn: s.weekday + 1, gridRow: `${row(s.startsMin)} / ${row(s.endsMin)}` }} className="bg-primary-soft opacity-60" />)}
        {Array.from({ length: rows }, (_, i) => <div key={i} role="row" aria-rowindex={i + 2} style={{ display: "contents" }}>
          <div role="rowheader" aria-colindex={1} className="sr-only">{hhmm(from + i * SLOT)}</div>
          {i === 0 && data.days.filter((d) => !open.includes(d)).map((d) => <div key={d.date} role="cell" aria-colindex={d.weekday + 1} aria-rowspan={rows}
            style={{ gridColumn: d.weekday + 1, gridRow: `2 / span ${rows}` }} className="flex items-start bg-zinc-100 p-1 text-xs text-zinc-600">{d.holiday ?? "Cerrado"}</div>)}
          {data.appointments.filter((a) => row(limaMinute(a.startsAt)) === i + 2).map((a) => {
            const day = data.days.find((d) => d.date === limaDate(a.startsAt));
            const span = Math.max(1, Math.round((new Date(a.endsAt).getTime() - new Date(a.startsAt).getTime()) / 60_000 / SLOT));
            return day ? <div key={a.id} role="cell" aria-colindex={day.weekday + 1} aria-rowspan={span}
              style={{ gridColumn: day.weekday + 1, gridRow: `${i + 2} / span ${span}` }} className="z-10"><Item a={a} onOpen={onOpen} /></div> : null;
          })}
        </div>)}
      </div>
    </div>
    <div className="flex min-w-0 flex-col gap-3 md:hidden">
      {data.days.map((d) => <section key={d.date} className="card min-w-0 p-3" aria-label={dayName(d.date)}>
        <h3 className="text-sm font-bold">{dayName(d.date)}{!d.open ? ` · ${d.holiday ?? "Cerrado"}` : ""}</h3>
        {byDay(d.date).length === 0 ? <p className="text-xs text-zinc-600">Sin citas.</p> :
          <ul className="mt-2 flex flex-col gap-1">{byDay(d.date).map((a) => <li key={a.id} className="h-12"><Item a={a} onOpen={onOpen} /></li>)}</ul>}
      </section>)}
    </div>
  </>;
}
