import { useRef, useState, type FormEvent } from "react";
import { api, apiError } from "../../lib/api";
import { ConfirmModal } from "../ConfirmModal";

type Kind = "WARNING" | "SUSPENSION" | "BAN";
const LABELS: Record<Kind, string> = { WARNING: "Advertencia", SUSPENSION: "Suspensión", BAN: "Bloqueo" };

export function sanctionConfirmation(kind: Kind, days: number) {
  const sanction = `${LABELS[kind].toLowerCase()}${kind === "SUSPENSION" ? ` por ${days} días` : ""}`;
  return { title: `¿Aplicar ${sanction}?`, message: `Se avisará a la persona sobre la ${sanction}.`, confirmLabel: "Confirmar sanción" };
}

export function SanctionForm({ userId, admin, done }: { userId: string; admin: boolean; done: () => void }) {
  const [kind, setKind] = useState<Kind>("WARNING");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const requestInFlight = useRef(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || reason.trim().length < 5 || (kind === "SUSPENSION" && (days < 1 || days > 30))) return;
    setError("");
    setConfirming(true);
  };

  const confirmSanction = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await api.post(`/staff/users/${userId}/sanctions`, { kind, reason: reason.trim(), ...(kind === "SUSPENSION" ? { days } : {}) });
      setReason("");
      setConfirming(false);
      done();
    } catch (cause) {
      setError(apiError(cause));
      setConfirming(false);
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  };

  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-2" aria-label="Aplicar sanción">
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`kind-${userId}`}>Tipo de sanción
      <select id={`kind-${userId}`} className="input w-full max-w-xs" value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
        <option value="WARNING">{LABELS.WARNING}</option>
        <option value="SUSPENSION">{LABELS.SUSPENSION}</option>
        {admin && <option value="BAN">{LABELS.BAN}</option>}
      </select>
    </label>
    {kind === "SUSPENSION" && <label className="flex flex-col gap-1 text-sm" htmlFor={`days-${userId}`}>Días (1–30)
      <input id={`days-${userId}`} className="input w-24" type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} />
    </label>}
    <label className="flex min-w-0 flex-col gap-1 text-sm" htmlFor={`reason-${userId}`}>Motivo (obligatorio, 5–300)
      <textarea id={`reason-${userId}`} className="input min-h-20 w-full min-w-0" required minLength={5} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} />
    </label>
    {error && <p role="alert" className="break-words text-sm text-[#b91c1c]">{error}</p>}
    <button type="submit" className="btn btn-secondary btn-sm self-start" disabled={busy || reason.trim().length < 5 || (kind === "SUSPENSION" && (days < 1 || days > 30))}>
      {`Aplicar ${LABELS[kind].toLowerCase()}`}
    </button>
    <ConfirmModal info={confirming ? sanctionConfirmation(kind, days) : null}
      busy={busy} onConfirm={() => void confirmSanction()} onClose={() => setConfirming(false)} />
  </form>;
}
