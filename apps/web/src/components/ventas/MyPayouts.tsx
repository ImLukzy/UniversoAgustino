import { useInfiniteQuery } from "@tanstack/react-query";
import { api, apiError, fmtDate, pen } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { PrivateImage } from "../PrivateImage";
import type { PayoutPage } from "../equipo/payoutTypes";
export function MyPayouts() {
  const { user } = useAuth();
  const q = useInfiniteQuery({ queryKey: ["payouts", "mine", user?.id], initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get("/orders/payouts", { params: { page: pageParam } })).data as PayoutPage,
    getNextPageParam: (p) => p.nextPage, refetchInterval: 30000 });
  return <section id="mis-cobros" className="flex min-w-0 scroll-mt-4 flex-col gap-4"><h2 className="h-display text-2xl">Mis cobros</h2>
    <p className="text-sm text-zinc-600">El equipo paga tu neto en 24–48 h desde la atribución. Aquí verás su comprobante.</p>
    {q.isLoading && <p role="status">Cargando cobros…</p>}{q.error && <p role="alert">{apiError(q.error)}</p>}
    {q.data?.pages[0].data.length === 0 && <p>Aún no tienes ventas verificadas.</p>}
    {(q.data?.pages ?? []).flatMap((p) => p.data).map((p) => <article key={p.id} className="card flex min-w-0 flex-col gap-3 p-5">
      <h3 className="break-words font-semibold">{p.order.itemTitle}</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt>Precio</dt><dd>{pen(p.amountCents)}</dd></div>
        <div><dt>Comisión {(p.order.feeBps ?? 1300) / 100}%</dt><dd>{pen(p.feeCents)}</dd></div>
        <div><dt>Neto {p.status === "COMPLETED" ? "recibido" : "por recibir"}</dt><dd className="font-bold">{pen(p.netCents)}</dd></div>
        <div><dt>Estado</dt><dd>{p.status === "COMPLETED" ? "Pagado" : p.status === "FROZEN" ? "Congelado" : "Pendiente"}</dd></div></dl>
      <p className="text-sm text-zinc-600">{p.completedAt ? `Pagado ${fmtDate(p.completedAt)}` : `Vence ${fmtDate(p.dueAt)}`}</p>
      {p.frozenReason && <p className="break-words text-sm">Reclamo: {p.frozenReason}</p>}
      {p.status === "COMPLETED" && p.proofUrl && <PrivateImage path={p.proofUrl} alt="Comprobante del pago recibido" expandable />}
      {p.paymentRef && <p className="break-all text-sm">Operación: {p.paymentRef}</p>}
    </article>)}
    {q.hasNextPage && <button className="btn btn-secondary self-start" disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Ver más cobros</button>}
  </section>;
}
