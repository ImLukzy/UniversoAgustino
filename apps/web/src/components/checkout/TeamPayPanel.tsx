import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError, pen } from "../../lib/api";
import { PrivateImage } from "../PrivateImage";
import { ProofForm } from "./ProofForm";
import type { PaymentAccount } from "../equipo/paymentAccountTypes";
export function TeamPayPanel({ orderId, amountCents, onPaid }: { orderId: string; amountCents: number; onPaid: () => void }) {
  const [selected, setSelected] = useState("");
  const query = useQuery({ queryKey: ["payment-accounts", orderId], queryFn: async () => (await api.get(`/orders/${orderId}/payment-accounts`)).data.data as PaymentAccount[] });
  const account = query.data?.find((a) => a.id === selected) ?? query.data?.[0];
  if (query.isPending) return <p role="status" className="min-h-32">Cargando cuentas del equipo…</p>;
  if (query.error) return <p role="alert">{apiError(query.error)}</p>;
  if (!account) return <p role="status">El equipo aún no tiene cuentas activas. Espera antes de pagar.</p>;
  return <div className="flex min-w-0 flex-col gap-4">
    <label className="flex min-w-0 flex-col gap-1 text-sm">Cuenta destino del equipo<select className="input w-full min-w-0" value={account.id} onChange={(e) => setSelected(e.target.value)}>
      {query.data?.map((a) => <option key={a.id} value={a.id}>{a.holder} · {a.method === "OTHER" ? "Otro" : a.method}</option>)}</select></label>
    <p className="break-words text-sm">Paga <strong>{pen(amountCents)}</strong> a <strong>{account.holder}</strong> · {account.number}</p>
    <div className="flex min-w-0 flex-wrap gap-4"><PrivateImage path={account.photoUrl} alt="Foto del titular" /><PrivateImage path={account.qrUrl} alt="QR de cobro del equipo" /></div>
    <p className="text-sm text-zinc-600">Verifica el titular en tu aplicación antes de pagar. Adjunta el comprobante para que el equipo revise el abono.</p>
    <ProofForm key={account.id} orderId={orderId} paymentAccountId={account.id} onPaid={onPaid} />
  </div>;
}
