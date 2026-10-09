import { useInfiniteQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { PayoutCard } from "./PayoutCard";
import type { PayoutPage } from "./payoutTypes";
import { PanelLoading } from "../teamPanel/PanelLoading";
export function PayoutsTab({ completed = false }: { completed?: boolean }) {
  const { user } = useAuth(); const status = completed ? "COMPLETED" : "PENDING";
  const pending = useInfiniteQuery({ queryKey: ["staff", "payouts", status, user?.id], initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get("/staff/payouts", { params: { status, page: pageParam } })).data as PayoutPage,
    getNextPageParam: (p) => p.nextPage, refetchInterval: 30000 });
  const frozen = useInfiniteQuery({ queryKey: ["staff", "payouts", "FROZEN", user?.id], initialPageParam: 1, enabled: !completed,
    queryFn: async ({ pageParam }) => (await api.get("/staff/payouts", { params: { status: "FROZEN", page: pageParam } })).data as PayoutPage,
    getNextPageParam: (p) => p.nextPage, refetchInterval: 30000 });
  const rows = (pending.data?.pages ?? []).flatMap((p) => p.data), stopped = !completed ? (frozen.data?.pages ?? []).flatMap((p) => p.data) : [];
  const refreshed = () => { void pending.refetch(); if (!completed) void frozen.refetch(); };
  return <section className="flex min-w-0 flex-col gap-4">
    {!completed && <p className="text-sm text-zinc-600">Paga el neto indicado en 24–48 h desde la atribución y adjunta tu comprobante.</p>}
    {pending.isLoading && <PanelLoading label="Cargando liquidaciones…" />}{(pending.error || (!completed && frozen.error)) && <p role="alert">{apiError(pending.error || frozen.error)}</p>}
    {!pending.isLoading && !frozen.isLoading && rows.length + stopped.length === 0 && <p className="card p-5 text-sm">No tienes liquidaciones en esta sección.</p>}
    {[...rows, ...stopped].map((p) => <PayoutCard key={p.id} row={p} admin={user?.role === "admin"} refreshed={refreshed} />)}
    {pending.hasNextPage && <button className="btn btn-secondary self-start" disabled={pending.isFetchingNextPage} onClick={() => void pending.fetchNextPage()}>Ver más liquidaciones</button>}
    {!completed && frozen.hasNextPage && <button className="btn btn-secondary self-start" disabled={frozen.isFetchingNextPage} onClick={() => void frozen.fetchNextPage()}>Ver más congeladas</button>}
  </section>;
}
