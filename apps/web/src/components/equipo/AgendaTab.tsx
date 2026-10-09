import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, mondayOf } from "@hub/shared";
import { api, apiError } from "../../lib/api";
import { AgendaFilters } from "./AgendaFilters";
import { AgendaGrid } from "./AgendaGrid";
import { PanelLoading } from "../teamPanel/PanelLoading";
import type { Agenda } from "./agendaTypes";

const todayLima = () => new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
// Pestaña Agenda (spec 34): solo lectura; reservar sigue en la ficha del caso.
export function AgendaTab({ goCases }: { goCases: () => void }) {
  const [week, setWeek] = useState(() => mondayOf(todayLima())), [sedeId, setSede] = useState(""), [staffId, setStaff] = useState("");
  const sedes = useQuery({ queryKey: ["staff", "sedes", "agenda"], queryFn: async () => (await api.get("/staff/sedes")).data.data as { id: string; name: string }[] });
  const agenda = useQuery({ queryKey: ["staff", "agenda", week, sedeId, staffId], refetchInterval: 60_000,
    queryFn: async () => (await api.get("/staff/agenda", { params: { week, ...(sedeId ? { sedeId } : {}), ...(staffId ? { staffId } : {}) } })).data.data as Agenda });
  const move = (delta: number | null) => setWeek(delta === null ? mondayOf(todayLima()) : addDays(week, delta));
  return <section className="flex min-w-0 flex-col gap-4" aria-label="Agenda semanal">
    <AgendaFilters sedes={sedes.data ?? []} staff={agenda.data?.staff ?? []} sedeId={sedeId} staffId={staffId} week={week} onSede={setSede} onStaff={setStaff} onWeek={move} />
    <div className="min-h-[420px] min-w-0" aria-busy={agenda.isFetching}>
      {agenda.isPending && <PanelLoading label="Cargando agenda…" rows={3} />}
      {agenda.isError && <p role="alert" className="break-words text-[#b91c1c]">{apiError(agenda.error)}</p>}
      {agenda.data && <AgendaGrid data={agenda.data} onOpen={goCases} />}
    </div>
  </section>;
}
