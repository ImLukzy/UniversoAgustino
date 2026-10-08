import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { CASE_LABELS } from "./caseTypes";

type Metrics = { todayAppointments: number; noShowsThisMonth: number; pendingReviews: number; openReports: number;
  casesByStatus: Record<string, number>; custodyByStaff: { staffId: string; name: string; count: number }[] };
// Métricas del panel (spec 34); solo lectura.
export function MetricCards() {
  const m = useQuery({ queryKey: ["staff", "metrics"], refetchInterval: 60_000, queryFn: async () => (await api.get("/staff/metrics")).data.data as Metrics });
  if (m.isPending) return <p role="status" className="min-h-24">Cargando métricas…</p>;
  if (m.isError) return <p role="alert" className="break-words text-[#b91c1c]">{apiError(m.error)}</p>;
  const d = m.data, cards = [["Citas de hoy", d.todayAppointments], ["Faltas del mes", d.noShowsThisMonth], ["Publicaciones por revisar", d.pendingReviews], ["Denuncias abiertas", d.openReports]] as const;
  return <div className="flex min-w-0 flex-col gap-4">
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => <div key={label} className="card p-4"><dt className="text-xs font-bold text-zinc-600">{label}</dt><dd className="text-3xl font-bold text-primary">{value}</dd></div>)}
    </dl>
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
      <section className="card min-w-0 p-4" aria-label="Casos por estado"><h2 className="font-bold">Casos por estado</h2>
        {Object.keys(d.casesByStatus).length === 0 ? <p className="text-sm">Sin casos.</p> :
          <ul className="text-sm">{Object.entries(d.casesByStatus).map(([s, n]) => <li key={s} className="flex justify-between gap-2"><span>{CASE_LABELS[s as keyof typeof CASE_LABELS] ?? s}</span><b>{n}</b></li>)}</ul>}</section>
      <section className="card min-w-0 p-4" aria-label="Objetos en custodia por trabajador"><h2 className="font-bold">En custodia por trabajador</h2>
        {d.custodyByStaff.length === 0 ? <p className="text-sm">Nadie tiene objetos en custodia.</p> :
          <ul className="text-sm">{d.custodyByStaff.map((c) => <li key={c.staffId} className="flex justify-between gap-2"><span className="min-w-0 break-words">{c.name}</span><b>{c.count}</b></li>)}</ul>}</section>
    </div>
  </div>;
}
