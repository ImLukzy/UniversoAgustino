// Reglas puras de la cola de archivos de /publicar (spec 24). Con 2 o más
// archivos es un lote: comparten los datos del apunte y cada uno tiene su
// propio título.
export interface QueueItem {
  id: string;
  file: File;
  url: string | null;
  progress: number;
  failed: string | null;
  title: string;
}

type Named = Pick<QueueItem, "title"> & { file: Pick<File, "name"> };
type Uploadable = Pick<QueueItem, "url" | "failed">;

export const MIN_TITLE = 4;

// "Farmaco_parcial-2024.pdf" → "Farmaco parcial 2024"
export const titleFromFile = (name: string) =>
  name
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

export const titleOk = (t: string) => t.trim().length >= MIN_TITLE;

export const isBatch = (items: unknown[]) => items.length >= 2;

// Todos los archivos subidos al almacenamiento y ninguno con error.
export const queueUploaded = (items: Uploadable[]) => items.length > 0 && items.every((x) => !!x.url && !x.failed);

// Primer archivo cuyo título no alcanza el mínimo (mensaje listo para mostrar).
export function batchTitleIssue(items: Named[]): string | null {
  const bad = items.find((x) => !titleOk(x.title));
  return bad ? `El título de "${bad.file.name}" necesita al menos ${MIN_TITLE} caracteres.` : null;
}

export const partialMessage = (done: number, total: number, reason: string) =>
  done > 0 ? `Se publicaron ${done} de ${total}. Los restantes siguen en la lista: ${reason}` : reason;
