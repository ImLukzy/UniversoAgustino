import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { CaseSave, StaffCase } from "./caseTypes";

export function CaseAssignment({ row, admin, busy, save }: { row: StaffCase; admin: boolean; busy: boolean; save: CaseSave }) {
  const [staff, setStaff] = useState(row.assigneeId ?? "");
  const members = useQuery({ queryKey: ["staff", "case-members"], enabled: admin,
    queryFn: async () => (await api.get("/staff/members")).data.data as { id: string; fullName: string; email: string }[] });
  if (!admin) return !row.assigneeId ? <button type="button" disabled={busy} onClick={() => void save(`/staff/cases/${row.id}/take`)} className="btn btn-primary">Tomar caso</button> : null;
  return <form className="flex min-w-0 flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void save(`/staff/cases/${row.id}/assign`, { assigneeId: staff }); }}>
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm" htmlFor={`staff-${row.id}`}>Custodio
      <select id={`staff-${row.id}`} required value={staff} onChange={(e) => setStaff(e.target.value)} className="input w-full min-w-0">
        <option value="">Selecciona un miembro</option>{members.data?.map((m) => <option key={m.id} value={m.id}>{m.fullName || m.email}</option>)}
      </select></label><button type="submit" disabled={busy || !staff || members.isPending} className="btn btn-secondary">Asignar</button>
  </form>;
}
