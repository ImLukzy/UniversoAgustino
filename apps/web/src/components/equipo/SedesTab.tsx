import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError } from "../../lib/api";
import { SedeForm } from "./SedeForm";
import { HoursForm } from "./HoursForm";
import { HolidaysForm } from "./HolidaysForm";
import { ShiftsForm } from "./ShiftsForm";
import { DAYS, timeText, type SaveSchedule, type Sede, type Shift, type Schedule, type StaffChoice } from "./sedeTypes";

export function SedesTab() {
  const { user } = useAuth(); const qc = useQueryClient(); const admin = user?.role === "admin";
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const sedes = useQuery({ queryKey: ["staff", "sedes", user?.id], queryFn: async () => (await api.get("/staff/sedes")).data.data as Sede[] });
  const schedule = useQuery({ queryKey: ["staff", "schedule", user?.id], queryFn: async () => (await api.get("/staff/schedule")).data.data as Schedule });
  const shifts = useQuery({ queryKey: ["staff", "shifts", user?.id], queryFn: async () => (await api.get("/staff/shifts")).data.data as Shift[] });
  const members = useQuery({ queryKey: ["staff", "members", user?.id], enabled: admin, queryFn: async () => (await api.get("/staff/members")).data.data as StaffChoice[] });
  const save: SaveSchedule = async (method, path, body) => {
    setBusy(true); setMsg("");
    try { await api.request({ method, url: path, data: body }); setMsg("Configuración guardada.");
      await Promise.all([qc.invalidateQueries({ queryKey: ["staff"] }), qc.invalidateQueries({ queryKey: ["sedes"] })]); return true;
    } catch (error) { setMsg(apiError(error)); return false; } finally { setBusy(false); }
  };
  const error = sedes.error ?? schedule.error ?? shifts.error ?? members.error;
  if (sedes.isPending || schedule.isPending || shifts.isPending) return <div className="min-h-64" role="status">Cargando sedes y horarios…</div>;
  return <div className="flex min-w-0 flex-col gap-5">
    <p role="status" className="min-h-6 break-words text-sm">{msg}</p>{error && <p role="alert">{apiError(error)}</p>}
    {admin ? <>
      <SedeForm sedes={sedes.data ?? []} save={save} busy={busy} />
      <HoursForm hours={schedule.data?.hours ?? []} save={save} busy={busy} />
      <HolidaysForm holidays={schedule.data?.holidays ?? []} save={save} busy={busy} />
    </> : <section className="card flex min-w-0 flex-col gap-3 p-5"><h2 className="font-bold">Sedes y horario · America/Lima</h2>
      {sedes.data?.map((s) => <div key={s.id} className="min-w-0 break-words text-sm">
        <p className="font-bold">{s.name} · {s.active ? "Activa" : "Inactiva"}</p>
        {s.address.trim() && <p>{s.address}</p>}
        <p>{s.meetingPoint.trim() || "Punto por definir"}</p>
      </div>)}
      {DAYS.map((day, weekday) => { const h = schedule.data?.hours.find((v) => v.weekday === weekday); return <p key={day} className="text-sm">{day}: {h ? `${timeText(h.opens)}–${timeText(h.closes)}${h.special ? " (especial)" : ""}` : "Cerrado"}</p>; })}
      {schedule.data?.holidays.map((h) => <p key={h.id} className="break-words text-sm">Cerrado {h.date.slice(0, 10)} · {h.reason}</p>)}
    </section>}
    <ShiftsForm shifts={shifts.data ?? []} sedes={sedes.data ?? []} members={members.data ?? []} admin={admin} save={save} busy={busy} />
  </div>;
}
