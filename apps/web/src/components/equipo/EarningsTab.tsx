import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError, pen } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { PanelLoading } from "../teamPanel/PanelLoading";
type Earnings = { commissionCents: number; verifiedCount: number; collectors: { collectorId: string; fullName?: string; email?: string; commissionCents: number; verifiedCount: number }[] };
export function EarningsTab() {
  const { user } = useAuth();
  const [from, setFrom] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" }).slice(0, 7) + "-01");
  const [to, setTo] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" }));
  const valid = !!from && !!to && from <= to;
  const q = useQuery({ queryKey: ["staff", "earnings", user?.id, from, to], enabled: valid,
    queryFn: async () => (await api.get("/staff/payouts/earnings", { params: { from: `${from}T00:00:00-05:00`, to: `${to}T23:59:59.999-05:00` } })).data.data as Earnings });
  return <section className="flex min-w-0 flex-col gap-4">
    <div className="flex flex-wrap gap-3"><label className="flex min-w-0 flex-col gap-1 text-sm">Desde<input className="input max-w-full" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label className="flex min-w-0 flex-col gap-1 text-sm">Hasta<input className="input max-w-full" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></div>
    {!valid && <p role="alert">Selecciona un periodo válido.</p>}{q.isLoading && <PanelLoading label="Cargando ganancias…" rows={1} />}{q.error && <p role="alert">{apiError(q.error)}</p>}
    {q.data && <><div className="card p-5"><p className="text-sm">Comisión de {q.data.verifiedCount} pedidos verificados</p><p className="text-3xl font-bold">{pen(q.data.commissionCents)}</p></div>
      {user?.role === "admin" && q.data.collectors.map((c) => <div className="card min-w-0 p-4" key={c.collectorId}><p className="break-all text-sm">Trabajador: {c.fullName || c.email || c.collectorId}</p><p>{pen(c.commissionCents)} · {c.verifiedCount} pedidos</p></div>)}</>}
  </section>;
}
