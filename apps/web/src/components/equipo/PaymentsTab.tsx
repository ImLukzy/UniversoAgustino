import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError, type HubOrder } from "../../lib/api";
import { PaymentReviewCard } from "./PaymentReviewCard";
import { PanelLoading } from "../teamPanel/PanelLoading";
export function PaymentsTab() {
  const { user } = useAuth(); const qc = useQueryClient();
  const query = useQuery({ queryKey: ["staff", "payments", user?.id], queryFn: async () => (await api.get("/staff/payments")).data.data as HubOrder[], refetchInterval: 30_000 });
  const refreshed = () => { void qc.invalidateQueries({ queryKey: ["staff", "payments"] }); };
  if (query.isPending) return <PanelLoading label="Cargando pagos…" />;
  return <section className="flex min-w-0 flex-col gap-4">
    {query.error && <p role="alert">{apiError(query.error)}</p>}
    {query.data?.length === 0 && <p role="status" className="card p-5 text-sm">No tienes comprobantes pendientes.</p>}
    {query.data?.map((o) => <PaymentReviewCard key={o.id} order={o} refreshed={refreshed} />)}
  </section>;
}
