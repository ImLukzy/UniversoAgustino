import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError, type HubOrder } from "../../lib/api";
import { PaymentReviewCard } from "./PaymentReviewCard";
export function PaymentsTab() {
  const { user } = useAuth(); const qc = useQueryClient();
  const query = useQuery({ queryKey: ["staff", "payments", user?.id], queryFn: async () => (await api.get("/staff/payments")).data.data as HubOrder[], refetchInterval: 30_000 });
  const refreshed = () => { void qc.invalidateQueries({ queryKey: ["staff", "payments"] }); };
  if (query.isPending) return <p role="status" className="min-h-32">Cargando pagos…</p>;
  return <section className="flex min-w-0 flex-col gap-4"><h2 className="font-bold">Pagos por verificar</h2>
    <p className="text-sm">Los primeros 50 comprobantes pendientes, empezando por el más antiguo.</p>
    {query.error && <p role="alert">{apiError(query.error)}</p>}
    {query.data?.length === 0 && <p role="status">No tienes comprobantes pendientes.</p>}
    {query.data?.map((o) => <PaymentReviewCard key={o.id} order={o} refreshed={refreshed} />)}
  </section>;
}
