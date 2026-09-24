import { useState } from "react";
import { apiError, resolveQr, uploadFile, type PayMethod } from "../../lib/api";

// Datos de cobro del vendedor: método, titular/número y QR (subida real).
export function PayFields({ method, detail, qr, onMethod, onDetail, onQr }: {
  method: string;
  detail: string;
  qr: string;
  onMethod: (v: PayMethod) => void;
  onDetail: (v: string) => void;
  onQr: (v: string) => void;
}) {
  const [up, setUp] = useState(false);
  const [upErr, setUpErr] = useState("");
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setUp(true);
    setUpErr("");
    try {
      onQr(await uploadFile(f));
    } catch (e) {
      setUpErr(apiError(e));
    } finally {
      setUp(false);
    }
  };
  const preview = resolveQr(qr);
  const label = "flex flex-col gap-1 text-xs font-bold text-zinc-600";
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-dashed border-zinc-300 p-3 sm:grid-cols-2">
      <label className={label}>
        ¿Cómo te pagan?
        <select className="input" value={method} onChange={(e) => onMethod(e.target.value as PayMethod)}>
          <option value="YAPE">Yape</option>
          <option value="PLIN">Plin</option>
          <option value="AMBAS">Yape y Plin</option>
        </select>
      </label>
      <label className={label}>
        Titular / número
        <input className="input" value={detail} onChange={(e) => onDetail(e.target.value)} placeholder="Yape 999888777 - Tu nombre" maxLength={160} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        QR de cobro (imagen)
        <input type="file" accept="image/*" className="text-xs font-normal" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      <p className="min-h-[1rem] text-xs sm:col-span-2" role={upErr ? "alert" : undefined}>
        {up ? <span className="text-zinc-500">Subiendo QR…</span> : upErr ? <span className="font-semibold text-[#dc2626]">{upErr}</span> : null}
      </p>
      {preview && (
        <div className="flex items-center gap-3 sm:col-span-2">
          <img src={preview} alt="QR de cobro" className="h-20 w-20 rounded-lg border-2 border-zinc-900 object-cover" />
          <button type="button" className="text-xs font-bold text-[#dc2626] hover:underline" onClick={() => onQr("")}>Quitar QR</button>
        </div>
      )}
    </div>
  );
}
