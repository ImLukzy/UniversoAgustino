import { useState } from "react";
import { DAYS, timeMinutes, timeText, type SaveSchedule, type Sede, type Shift, type StaffChoice } from "./sedeTypes";
export function ShiftsForm({ shifts, sedes, members, save, busy, admin }: { shifts: Shift[]; sedes: Sede[]; members: StaffChoice[]; save: SaveSchedule; busy: boolean; admin: boolean }) {
  const [id, setId] = useState(""); const [userId, setUserId] = useState(""); const [sedeId, setSedeId] = useState("");
  const [day, setDay] = useState(1); const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("13:00");
  return <section className="card flex min-w-0 flex-col gap-4 p-5"><h2 className="font-bold">{admin ? "Turnos del equipo" : "Mis turnos"}</h2>
    {shifts.length === 0 && <p className="text-sm text-zinc-600">Sin turnos asignados.</p>}
    {shifts.map((s) => <div key={s.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b py-2">
      <p className="min-w-0 break-words text-sm">{s.user.profile?.fullName || s.user.email} · {s.sede.name}<br />{DAYS[s.weekday]} {timeText(s.startsMin)}–{timeText(s.endsMin)}</p>
      {admin && <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => {
        setId(s.id); setUserId(s.userId); setSedeId(s.sedeId); setDay(s.weekday); setStart(timeText(s.startsMin)); setEnd(timeText(s.endsMin));
      }}>Editar turno</button><button type="button" disabled={busy} className="btn btn-secondary btn-sm" onClick={() => {
        if (window.confirm("¿Quitar este turno?")) void save("delete", `/staff/shifts/${s.id}`);
      }}>Quitar turno</button></div>}
    </div>)}
    {admin && <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void save(id ? "patch" : "post", `/staff/shifts${id ? `/${id}` : ""}`,
      { userId, sedeId, weekday: day, startsMin: timeMinutes(start), endsMin: timeMinutes(end) }).then((ok) => { if (ok) setId(""); }); }}>
      <h3 className="font-bold">{id ? "Editar turno" : "Nuevo turno"}</h3>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Trabajador<select required className="input w-full min-w-0" value={userId} onChange={(e) => setUserId(e.target.value)}>
        <option value="">Selecciona un miembro</option>{members.map((m) => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}</select></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Sede<select required className="input w-full min-w-0" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
        <option value="">Selecciona una sede</option>{sedes.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm">Día<select className="input w-full" value={day} onChange={(e) => setDay(Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="flex min-w-0 flex-col gap-1 text-sm">Inicio<input type="time" required className="input w-full min-w-0" value={start} onChange={(e) => setStart(e.target.value)} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Fin<input type="time" required className="input w-full min-w-0" value={end} onChange={(e) => setEnd(e.target.value)} /></label></div>
      <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy} className="btn btn-primary">Guardar turno</button>
      {id && <button type="button" className="btn btn-secondary" onClick={() => setId("")}>Cancelar edición</button>}</div>
    </form>}
  </section>;
}
