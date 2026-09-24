import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { API_ORIGIN, api, apiError, uploadFileWithProgress } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

const inputCls =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 transition-shadow focus:border-primary focus:outline-none focus:shadow-[0_0_0_4px_rgb(var(--hub-p)/0.12)]";

// Paso "Constancia": n° de operación y voucher opcional (POST /uploads →
// ruta /uploads/<uuid> en payProofUrl) → POST /orders/:id/pay (PAID).
export function ProofForm({ orderId, onPaid }: { orderId: string; onPaid: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [proof, setProof] = useState("");
  const [voucher, setVoucher] = useState<{ name: string; path: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return setErr("El voucher debe ser una imagen (JPG o PNG).");
    setErr("");
    setProgress(0);
    try {
      const url = await uploadFileWithProgress(file, setProgress);
      setVoucher({ name: file.name, path: url.replace(API_ORIGIN, "") });
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setProgress(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const op = proof.trim();
    if (op.length < 3 && !voucher) return setErr("Escribe el n.º de operación o adjunta tu voucher.");
    if (op && op.length < 3) return setErr("El n.º de operación tiene al menos 3 caracteres.");
    setBusy(true);
    try {
      await api.post(`/orders/${orderId}/pay`, { payProof: op || undefined, payProofUrl: voucher?.path });
      toast.success("Pago declarado", "El vendedor lo confirmará y tu dinero quedará en custodia.");
      onPaid();
    } catch (ex) {
      setErr(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor="pay-proof" className="text-xs font-semibold text-zinc-700">N.º de operación</label>
      <input id="pay-proof" className={inputCls} value={proof} maxLength={160} inputMode="numeric" placeholder="Ej. 094821"
        onChange={(e) => { setProof(e.target.value); setErr(""); }} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files[0]); }}
        className="mt-2 flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 text-sm text-zinc-500 transition-colors hover:border-primary hover:text-primary"
      >
        <span className="material-symbols-outlined text-xl">{voucher ? "check_circle" : "add_a_photo"}</span>
        <span className="truncate">
          {progress !== null ? `Subiendo… ${progress}%` : voucher ? voucher.name : "Adjunta la captura del voucher (opcional)"}
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <p role="alert" className="min-h-[1.25rem] text-xs text-red-600">{err}</p>
      <button type="submit" disabled={busy || progress !== null}
        className="btn btn-primary btn-lg w-full">
        {busy ? "Enviando…" : "Ya pagué"}
      </button>
    </form>
  );
}
