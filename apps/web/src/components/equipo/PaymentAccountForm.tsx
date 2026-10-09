import { useState } from "react";
import { api, apiError } from "../../lib/api";
import { PrivateImage } from "../PrivateImage";
import type { AccountFields, PaymentAccount } from "./paymentAccountTypes";
const blank = (userId: string): AccountFields => ({ userId, method: "YAPE", holder: "", number: "", photoUrl: "", qrUrl: "", active: true });
export function PaymentAccountForm({ account, userId, members, saved }: {
  account?: PaymentAccount; userId: string; members?: { id: string; fullName: string }[]; saved: () => void;
}) {
  const [form, setForm] = useState<AccountFields>(account ?? blank(userId));
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const upload = async (key: "photoUrl" | "qrUrl", file?: File) => {
    if (!file) return; setBusy(true); setError("");
    const data = new FormData(); data.append("file", file); data.append("purpose", "team-account");
    try { const r = await api.post("/uploads", data); setForm((v) => ({ ...v, [key]: String(r.data.data.url) })); }
    catch (e) { setError(apiError(e)); } finally { setBusy(false); }
  };
  return <form className="card flex min-w-0 flex-col gap-3 p-5" onSubmit={(e) => {
    e.preventDefault(); setBusy(true); setError("");
    const { userId: owner, method, holder, number, photoUrl, qrUrl, active } = form;
    const data = { method, holder, number, photoUrl, qrUrl, active };
    void api.request({ method: account ? "patch" : "post", url: `/staff/payment-accounts${account ? `/${account.id}` : ""}`,
      data: account ? data : { ...data, userId: owner } }).then(saved).catch((err) => setError(apiError(err))).finally(() => setBusy(false));
  }}>
    <h2 className="font-bold">{account ? "Editar cuenta" : "Nueva cuenta"}</h2>
    {members && !account && <label className="flex min-w-0 flex-col gap-1">Trabajador<select className="input min-w-0" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
      {members.map((m) => <option key={m.id} value={m.id}>{m.fullName || m.id}</option>)}</select></label>}
    <label className="flex flex-col gap-1">Método<select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as AccountFields["method"] })}>
      <option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="OTHER">Otro</option></select></label>
    <label className="flex min-w-0 flex-col gap-1">Titular<input className="input min-w-0" required minLength={3} maxLength={120} value={form.holder} onChange={(e) => setForm({ ...form, holder: e.target.value })} /></label>
    <label className="flex min-w-0 flex-col gap-1">Número o cuenta<input className="input min-w-0" required minLength={3} maxLength={80} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></label>
    {(["photoUrl", "qrUrl"] as const).map((key) => <div key={key} className="flex min-w-0 flex-col gap-2">
      <label className="flex min-w-0 flex-col gap-1">{key === "qrUrl" ? "QR" : "Foto de perfil"}<input className="w-full min-w-0" type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(e) => void upload(key, e.target.files?.[0])} /></label>
      {form[key] && <PrivateImage path={form[key]} alt={key === "qrUrl" ? "QR de cobro" : "Foto de perfil"} />}</div>)}
    <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Activa</label>
    {error && <p role="alert" className="break-words text-sm">{error}</p>}
    <button className="btn btn-primary" disabled={busy || !form.photoUrl || !form.qrUrl} type="submit">{busy ? "Guardando…" : "Guardar cuenta"}</button>
  </form>;
}
