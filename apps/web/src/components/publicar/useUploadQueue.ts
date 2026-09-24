import { useState } from "react";
import { apiError, uploadFileWithProgress } from "../../lib/api";
import { MAX_UPLOAD_MB, tooBig } from "../../lib/publishing";
import { queueUploaded, titleFromFile, type QueueItem } from "../../lib/uploadQueue";

// Subida real de uno o varios archivos con progreso por archivo (spec 24).
// Cada archivo empieza a subir apenas se agrega; el título se prellena con
// su nombre y se edita en el paso 2 cuando es un lote.
export function useUploadQueue(onError: (msg: string) => void) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const patch = (id: string, p: Partial<QueueItem>) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = (list: FileList | File[] | null | undefined): QueueItem[] => {
    const fresh: QueueItem[] = [];
    for (const file of Array.from(list ?? [])) {
      if (tooBig(file)) {
        onError(`"${file.name}" supera los ${MAX_UPLOAD_MB} MB permitidos.`);
        continue;
      }
      fresh.push({ id: crypto.randomUUID(), file, url: null, progress: 0, failed: null, title: titleFromFile(file.name) });
    }
    if (!fresh.length) return fresh;
    setItems((prev) => [...prev, ...fresh]);
    for (const it of fresh) {
      uploadFileWithProgress(it.file, (pct) => patch(it.id, { progress: pct }))
        .then((url) => patch(it.id, { url, progress: 100 }))
        .catch((e: unknown) => patch(it.id, { failed: apiError(e) }));
    }
    return fresh;
  };

  return {
    items,
    add,
    remove: (id: string) => setItems((prev) => prev.filter((x) => x.id !== id)),
    setTitle: (id: string, title: string) => patch(id, { title }),
    uploaded: queueUploaded(items),
    uploading: items.some((x) => !x.url && !x.failed),
  };
}

export type UploadQueue = ReturnType<typeof useUploadQueue>;
