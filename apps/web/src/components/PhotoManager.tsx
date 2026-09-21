import { useState } from "react";
import { apiError, uploadFile } from "../lib/api";

// Gestor de fotos del producto (máx 4). Sube al servidor y devuelve URLs.
export function PhotoManager({
  value, onChange, max = 4,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const room = max - value.length;

  const add = async (files: FileList | null) => {
    if (!files || room <= 0) return;
    const picks = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (picks.length === 0) {
      setErr("Solo imágenes (JPG/PNG).");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const f of picks) urls.push(await uploadFile(f));
      onChange([...value, ...urls]);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {value.map((u, i) => (
          <div key={`${u}-${i}`} className="relative aspect-square overflow-hidden rounded-lg border">
            <img src={u} alt={`Foto ${i + 1} del producto`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-sm font-bold text-white hover:bg-red-600"
              aria-label={`Quitar foto ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        {room > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-primary hover:text-primary">
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            <span className="px-1 text-center text-[11px] font-semibold">{busy ? "Subiendo…" : `Agregar (${room})`}</span>
            <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="text-[11px] text-slate-400">Máximo {max} fotos. La primera es la portada. Se muestran tal cual, sin marcas.</p>
      {err && <p className="text-xs font-semibold text-red-600">{err}</p>}
    </div>
  );
}
