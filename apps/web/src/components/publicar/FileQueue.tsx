import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import { MAX_UPLOAD_MB, UPLOAD_ACCEPT, mbOf } from "../../lib/publishing";
import { titleOk } from "../../lib/uploadQueue";
import type { PublishForm } from "./usePublishForm";

// Paso 2 (apunte): zona de arrastre para uno o varios archivos y lista con
// progreso real. En un lote, cada archivo lleva su propio título.
export function FileQueue({ form }: { form: PublishForm }) {
  const [drag, setDrag] = useState(false);
  const { items } = form.queue;
  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          form.addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors ${items.length ? "p-5" : "p-8"} ${drag ? "border-zinc-900 bg-primary-soft" : "border-zinc-300 hover:border-zinc-900"}`}
      >
        <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-3xl text-zinc-800" aria-hidden="true">cloud_upload</span>
        <span className="font-bold text-zinc-950">{drag ? "Suelta tus archivos aquí" : items.length ? "Agregar más archivos al lote" : "Arrastra uno o varios archivos, o haz clic"}</span>
        <span className="text-sm text-zinc-500">PDF, JPG, PNG o EPUB · máx. {MAX_UPLOAD_MB} MB cada uno</span>
        <input
          type="file"
          multiple
          className="sr-only"
          accept={UPLOAD_ACCEPT}
          onChange={(e) => {
            form.addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="flex flex-col gap-2 rounded-xl border-2 border-zinc-900 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`material-symbols-outlined text-2xl ${/\.pdf$/i.test(it.file.name) ? "text-[#b91c1c]" : "text-primary"}`} aria-hidden="true">
                    {/\.pdf$/i.test(it.file.name) ? "picture_as_pdf" : "description"}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-zinc-950">{it.file.name}</span>
                    <span className="text-xs text-zinc-500">
                      {mbOf(it.file)} · {it.failed ? "no se pudo subir" : it.url ? "listo" : `subiendo ${it.progress}%`}
                    </span>
                  </span>
                </span>
                <button type="button" onClick={() => form.queue.remove(it.id)} aria-label={`Quitar ${it.file.name}`} className="btn-ghost h-9 w-9 shrink-0 px-0 text-[#b91c1c]">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
                <motion.div className={`h-full ${it.failed ? "bg-[#b91c1c]" : "bg-primary"}`} initial={false} animate={{ width: `${it.failed ? 100 : it.progress}%` }} transition={SPRING} />
              </div>
              {it.failed && <p role="alert" className="text-xs font-bold text-[#b91c1c]">{it.failed}</p>}
              {form.batch && (
                <label className="flex flex-col gap-1 text-xs font-bold text-zinc-700">
                  Título de este apunte *
                  <input className={`input h-10 text-sm ${titleOk(it.title) ? "" : "border-[#b91c1c]"}`} value={it.title} maxLength={160} onChange={(e) => form.queue.setTitle(it.id, e.target.value)} />
                </label>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
