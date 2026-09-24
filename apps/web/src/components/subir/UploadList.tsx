import { useRef, useState } from "react";
import { MAX_UPLOAD_MB, UPLOAD_ACCEPT, mbOf } from "../../lib/publishing";
import type { UploadItem } from "./useBulkUpload";

// Paso 1: zona de arrastre (varios archivos) y lista con progreso real.
export function UploadList({ items, onAdd, onRemove }: { items: UploadItem[]; onAdd: (files: FileList | null) => void; onRemove: (id: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onAdd(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${drag ? "border-zinc-900 bg-primary-soft" : "border-zinc-400 bg-white hover:border-zinc-900"}`}
      >
        <input ref={input} type="file" multiple accept={UPLOAD_ACCEPT} className="sr-only" onChange={(e) => { onAdd(e.target.files); e.target.value = ""; }} />
        <span className="material-symbols-outlined flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-3xl text-zinc-800">cloud_upload</span>
        <span className="text-xl font-extrabold text-zinc-950">Arrastra y suelta tus archivos</span>
        <span className="btn btn-dark btn-sm mt-2">Examinar…</span>
        <span className="mt-2 text-xs text-zinc-500">PDF, imágenes o EPUB · máx. {MAX_UPLOAD_MB} MB cada uno</span>
      </label>
      {items.length > 0 && (
        <ul className="card divide-y divide-dashed divide-zinc-300">
          {items.map((it) => (
            <li key={it.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="truncate text-sm font-bold text-zinc-900">{it.file.name}</span>
                  <span className="shrink-0 text-xs text-zinc-500">{mbOf(it.file)}</span>
                </span>
                <button type="button" onClick={() => onRemove(it.id)} aria-label={`Quitar ${it.file.name}`} className="btn-ghost h-8 w-8 px-0">
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${it.progress}%` }} />
              </div>
              {it.failed && <p role="alert" className="text-xs font-bold text-[#b91c1c]">{it.failed}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
