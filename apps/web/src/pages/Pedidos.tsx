import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, apiError, pen, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

export function Pedidos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const orders = useQuery({
    queryKey: ["orders-mine"],
    queryFn: async () => (await api.get("/orders/mine")).data.data as HubOrder[],
    enabled: !!user,
  });

  const confirm = useMutation({
    mutationFn: async (id: string) => (await api.post(`/orders/${id}/confirm-receipt`)).data,
    onSuccess: () => {
      setMsg("Recepción confirmada → escrow liberado.");
      qc.invalidateQueries({ queryKey: ["orders-mine"] });
    },
    onError: (e) => setMsg(apiError(e)),
  });

  if (!user)
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="underline font-semibold text-teal-700" to="/login">entrar</Link> para ver pedidos.
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl space-y-3 px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold">Mis pedidos (escrow académico)</h1>
      <p className="text-sm text-slate-500">PENDING → ESCROW (retenido) → RELEASED (liberado a 48h o entrega) / REFUNDED.</p>
      {msg && <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{msg}</p>}
      {orders.isLoading && <p>Cargando…</p>}
      {orders.data?.length === 0 && <div className="card p-6 text-sm">Sin compras aún. Ve al <Link className="underline font-semibold" to="/app">panel</Link>.</div>}
      {orders.data?.map((o) => (
        <div key={o.id} className="card flex flex-wrap items-center gap-2 p-4 text-sm">
          <div className="mr-auto">
            <p className="font-bold">{o.itemType} · {o.itemId.slice(0, 8)}…</p>
            <p className="text-slate-500">{pen(o.amountCents)} (fee {pen(o.feeCents)} → neto {pen(o.netCents)})</p>
          </div>
          <span className="badge-uni">{o.status}</span>
          {o.status === "ESCROW" && (
            <button disabled={confirm.isPending} onClick={() => confirm.mutate(o.id)} className="btn-primary text-sm disabled:opacity-50">
              Confirmar recepción
            </button>
          )}
        </div>
      ))}
    </main>
  );
}
