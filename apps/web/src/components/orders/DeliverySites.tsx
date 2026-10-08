import { useQuery } from "@tanstack/react-query";
import { api, apiError, resolveQr } from "../../lib/api";
import { DAYS, timeText, type Sede, type Schedule } from "../equipo/sedeTypes";

export function DeliverySites() {
  const sedes = useQuery({ queryKey: ["sedes", "active"], queryFn: async () => (await api.get("/sedes")).data.data as Sede[] });
  const schedule = useQuery({ queryKey: ["sedes", "schedule"], queryFn: async () => (await api.get("/sedes/schedule")).data.data as Schedule });
  const error = sedes.error ?? schedule.error;
  return <section className="card min-w-0 p-5"><h2 className="font-extrabold text-zinc-950">Sedes de entrega</h2>
    {sedes.isPending || schedule.isPending ? <p role="status" className="min-h-48 pt-3 text-sm">Cargando sedes y horarios…</p> : error ?
      <p role="alert" className="mt-3 text-sm">{apiError(error)}</p> : <>
      {sedes.data?.length === 0 && <p className="mt-3 text-sm">No hay sedes activas. El equipo coordinará la entrega.</p>}
      <ul className="mt-3 flex flex-col gap-3">{sedes.data?.map((s) => <li key={s.id} className="min-w-0 break-words text-sm">
        <h3 className="font-bold">{s.name}</h3>{s.photoUrl && <img src={resolveQr(s.photoUrl) ?? undefined} alt={`Sede ${s.name}`} width={96} height={96} className="my-2 h-24 w-24 rounded-lg object-cover" />}{s.address && <p>{s.address}</p>}<p>{s.meetingPoint || "Punto de encuentro pendiente de coordinación con el equipo."}</p>
      </li>)}</ul>
      <h3 className="mt-4 font-bold">Horario · America/Lima</h3>
      <ul className="mt-2 text-xs text-zinc-600">{DAYS.map((day, weekday) => { const h = schedule.data?.hours.find((v) => v.weekday === weekday);
        return <li key={day}>{day}: {h ? `${timeText(h.opens)}–${timeText(h.closes)}${h.special ? " (especial)" : ""}` : "Cerrado"}</li>; })}</ul>
      {(schedule.data?.holidays.length ?? 0) > 0 && <><h3 className="mt-4 font-bold">Feriados · cerrado</h3><ul className="mt-2 text-xs text-zinc-600">
        {schedule.data?.holidays.map((h) => <li key={h.id} className="break-words">{h.date.slice(0, 10)} · {h.reason}</li>)}
      </ul></>}
    </>}
  </section>;
}
