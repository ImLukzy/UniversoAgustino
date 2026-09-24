import { useState, type ReactNode } from "react";
import { api } from "../lib/api";
import { safeFileUrl } from "../lib/viewerUrl";

// Descarga con sesión (spec 15, T7): el archivo de pago exige Authorization,
// que un <a href> no envía. Se pide por la API (stream same-origin) como blob.
export function DownloadButton({ url, className, children }: { url?: string | null; className: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const safe = safeFileUrl(url);
  if (!safe) return null;

  const download = async () => {
    setBusy(true);
    try {
      const r = await api.get<Blob>(`${safe}?stream=1`, { responseType: "blob" });
      const href = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = href;
      a.download = safe.split("/").pop() ?? "documento";
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch {
      /* 403/red: el botón vuelve a habilitarse para reintentar */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void download()} disabled={busy} aria-busy={busy} className={className}>
      {children}
    </button>
  );
}
