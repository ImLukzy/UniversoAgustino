type Option = { id: string; name: string };
type Props = { sedes: Option[]; staff: Option[]; sedeId: string; staffId: string; week: string;
  onSede: (v: string) => void; onStaff: (v: string) => void; onWeek: (delta: number | null) => void };
// Filtros por sede y trabajador + navegación de semana (spec 34).
export function AgendaFilters({ sedes, staff, sedeId, staffId, week, onSede, onStaff, onWeek }: Props) {
  return <div className="card flex min-w-0 flex-wrap items-end gap-3 p-4" role="group" aria-label="Filtros de la agenda">
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor="agenda-sede">Sede
      <select id="agenda-sede" className="input min-w-0" value={sedeId} onChange={(e) => onSede(e.target.value)}>
        <option value="">Todas</option>{sedes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor="agenda-staff">Trabajador
      <select id="agenda-staff" className="input min-w-0" value={staffId} onChange={(e) => onStaff(e.target.value)}>
        <option value="">Todos</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onWeek(-7)}>Semana anterior</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onWeek(null)}>Hoy</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onWeek(7)}>Semana siguiente</button>
      <span className="text-sm font-bold" aria-live="polite">Semana del {week}</span>
    </div>
  </div>;
}
