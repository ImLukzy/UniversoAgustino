import { useState } from "react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { SPRING } from "../lib/motion";
import { apiError, uploadFile } from "../lib/api";

// Gestor de fotos del producto (máx 4). Sube al servidor y devuelve URLs.
// La primera foto es la portada del anuncio: arrastra los tiles para
// reordenar (Reorder con spring 500/30) y el badge "Portada" viaja con
// layoutId="primaryPhotoBadge". Mismo contrato value/onChange que antes.
export function PhotoManager({
  value, onChange, max = 4, accentColor = null,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  accentColor?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const room = max - value.length;
  // Hover con acento de carrera cuando el padre lo provee; si no, el
  // hover genérico de las clases (primary) sigue vigente.
  const hoverAccent = accentColor ? { borderColor: accentColor, color: accentColor } : undefined;

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
      {/* Un solo grid de 4 columnas: el Group usa display:contents para que
          tiles y zona de subida compartan la cuadrícula. Máx 4 fotos = 1 fila,
          por eso el reorden es en eje X. */}
      <div className="grid grid-cols-4 gap-2">
        <Reorder.Group
          axis="x"
          values={value}
          onReorder={onChange}
          className="contents"
        >
          <AnimatePresence initial={false}>
            {value.map((u, i) => (
              <Reorder.Item
                key={u}
                value={u}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={SPRING}
                whileDrag={{ scale: 1.05 }}
                className="relative aspect-square cursor-grab overflow-hidden rounded-lg border border-zinc-200/80 active:cursor-grabbing"
              >
                <img src={u} alt={`Foto ${i + 1} del producto`} draggable={false} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <motion.span layoutId="primaryPhotoBadge" className="inline-block">
                      Portada
                    </motion.span>
                  </span>
                )}
                <motion.button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  initial={{ opacity: 0.75 }}
                  whileHover={{ opacity: 1, scale: 1.05 }}
                  transition={SPRING}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-sm font-bold text-white hover:bg-red-600"
                  aria-label={`Quitar foto ${i + 1}`}
                >
                  ×
                </motion.button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
        {room > 0 && (
          <motion.label
            whileHover={{ scale: 1.02, ...hoverAccent }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-300 text-zinc-500 transition-colors hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            <span className="px-1 text-center text-[11px] font-semibold">{busy ? "Subiendo…" : `Agregar (${room})`}</span>
            <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
          </motion.label>
        )}
      </div>
      <p className="text-[11px] text-zinc-500">Máximo {max} fotos. La primera es la portada: arrástrala para cambiarla. Se muestran tal cual, sin marcas.</p>
      {err && <p className="text-xs font-semibold text-red-600">{err}</p>}
    </div>
  );
}
