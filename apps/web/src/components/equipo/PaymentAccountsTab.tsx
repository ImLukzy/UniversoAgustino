import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api, apiError } from "../../lib/api";
import { PaymentAccountForm } from "./PaymentAccountForm";
import type { PaymentAccount } from "./paymentAccountTypes";
import { PanelLoading } from "../teamPanel/PanelLoading";
export function PaymentAccountsTab() {
  const { user } = useAuth(); const qc = useQueryClient(); const [editing, setEditing] = useState<PaymentAccount>(); const [version, setVersion] = useState(0);
  const accounts = useQuery({ queryKey: ["staff", "payment-accounts", user?.id], queryFn: async () => (await api.get("/staff/payment-accounts")).data.data as PaymentAccount[] });
  const members = useQuery({ queryKey: ["staff", "members", user?.id], enabled: user?.role === "admin", queryFn: async () => (await api.get("/staff/members")).data.data as { id: string; fullName: string }[] });
  if (accounts.isPending) return <PanelLoading label="Cargando cuentas…" />;
  return <section className="flex min-w-0 flex-col gap-4">
    {accounts.error && <p role="alert">{apiError(accounts.error)}</p>}{members.error && <p role="alert">{apiError(members.error)}</p>}
    {accounts.data?.map((a) => <div key={a.id} className="card flex min-w-0 flex-wrap items-center justify-between gap-3 p-4">
      <p className="min-w-0 break-words">{a.holder} · {a.method} · {a.number} · {a.active ? "Activa" : "Inactiva"}</p>
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => { setEditing(a); setVersion((v) => v + 1); }}>Editar</button></div>)}
    <button className="btn btn-secondary" type="button" onClick={() => { setEditing(undefined); setVersion((v) => v + 1); }}>Nueva cuenta</button>
    {user && <PaymentAccountForm key={version} account={editing} userId={user.id} members={members.data} saved={() => {
      setEditing(undefined); setVersion((v) => v + 1); void qc.invalidateQueries({ queryKey: ["staff", "payment-accounts"] });
    }} />}
  </section>;
}
