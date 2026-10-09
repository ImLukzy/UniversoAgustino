import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { API_ORIGIN, api, apiError, pen, uploadFileWithProgress } from "../../lib/api";
import { PrivateImage } from "../PrivateImage";
import type { PaymentAccount } from "./paymentAccountTypes";
export type PhysicalPayment = { method: "OPERATION" | "CASH"; accountId: string; proofUrl: string; reference: string; confirmed: boolean; uploading: boolean };
export const paymentReady = (v: PhysicalPayment) => v.confirmed && !v.uploading && (v.method === "CASH" || (!!v.accountId && !!v.proofUrl && (!v.reference.trim() || v.reference.trim().length >= 3)));
export function PhysicalPaymentFields({ value: v, setValue, amountCents, busy }: { value: PhysicalPayment; setValue: Dispatch<SetStateAction<PhysicalPayment>>; amountCents: number; busy: boolean }) {
  const { user } = useAuth(); const [error, setError] = useState(""), [progress, setProgress] = useState(0);
  const q = useQuery({ queryKey: ["staff", "physical-accounts", user?.id], enabled: v.method === "OPERATION",
    queryFn: async () => (await api.get("/staff/payment-accounts")).data.data as PaymentAccount[] });
  const active = q.data?.filter((a) => a.active) ?? [], account = active.find((a) => a.id === v.accountId);
  const upload = async (file?: File) => {
    if (!file) return; setError(""); setValue((p) => ({ ...p, proofUrl: "", confirmed: false }));
    if (!["image/png", "image/jpeg"].includes(file.type)) return setError("Adjunta una foto JPG o PNG.");
    setValue((p) => ({ ...p, uploading: true })); setProgress(0);
    try { const path = (await uploadFileWithProgress(file, setProgress, "payment-proof")).replace(API_ORIGIN, ""); setValue((p) => ({ ...p, proofUrl: path })); }
    catch (e) { setError(apiError(e)); } finally { setValue((p) => ({ ...p, uploading: false })); }
  };
  return <div className="flex min-w-0 flex-col gap-3"><p className="font-semibold">Cobrar {pen(amountCents)} al comprador en sede</p>
    <label className="flex flex-col gap-1 text-sm">Pago al equipo<select className="input" value={v.method} disabled={busy || v.uploading} onChange={(e) => setValue((p) => ({ ...p, method: e.target.value as PhysicalPayment["method"], accountId: "", proofUrl: "", reference: "", confirmed: false }))}>
      <option value="OPERATION">Transferencia a cuenta del equipo</option><option value="CASH">Efectivo recibido por mí</option></select></label>
    {v.method === "OPERATION" && <>
      {q.isLoading && <p role="status">Cargando cuentas…</p>}{q.error && <p role="alert">{apiError(q.error)}</p>}
      {!q.isLoading && active.length === 0 && <p>No tienes cuentas activas. Crea una en Cuentas de cobro o registra efectivo si lo recibiste.</p>}
      <label className="flex min-w-0 flex-col gap-1 text-sm">Cuenta destino<select className="input max-w-full" value={v.accountId} disabled={busy || v.uploading} onChange={(e) => setValue((p) => ({ ...p, accountId: e.target.value, confirmed: false }))}>
        <option value="">Selecciona una cuenta activa</option>{active.map((a) => <option key={a.id} value={a.id}>{a.method} · {a.holder} · {a.number}</option>)}</select></label>
      {account && <div className="flex min-w-0 flex-wrap gap-3"><PrivateImage path={account.photoUrl} alt="Titular del equipo" /><PrivateImage path={account.qrUrl} alt="QR de cobro del equipo" expandable /></div>}
      <label className="flex min-w-0 flex-col gap-1 text-sm">Foto del comprobante (obligatoria)<input type="file" accept="image/jpeg,image/png" className="input max-w-full min-w-0 text-xs" disabled={busy || v.uploading} onChange={(e) => void upload(e.target.files?.[0])} /></label>
      {v.uploading && <p role="status">Subiendo: {progress}%</p>}{v.proofUrl && <PrivateImage path={v.proofUrl} alt="Comprobante del cobro físico" expandable />}
      <label className="flex flex-col gap-1 text-sm">N.º de operación (opcional)<input className="input" maxLength={160} value={v.reference} disabled={busy} onChange={(e) => setValue((p) => ({ ...p, reference: e.target.value }))} /></label>
    </>}
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={v.confirmed} disabled={busy || v.uploading} onChange={(e) => setValue((p) => ({ ...p, confirmed: e.target.checked }))} />
      {v.method === "CASH" ? "Confirmo que recibí el efectivo del comprador en sede." : "Verifiqué el abono real en la cuenta del equipo y el comprobante adjunto."}</label>
    {error && <p role="alert" className="break-words text-sm text-error">{error}</p>}
  </div>;
}
