import { useEffect, useState } from "react";
import { API_ORIGIN, api } from "../lib/api";
export function PrivateImage({ path, alt, expandable = false }: { path: string; alt: string; expandable?: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true; let objectUrl = ""; setSrc("");
    void api.get<Blob>(`${API_ORIGIN}${path}`, { responseType: "blob", params: { stream: "1" } }).then((r) => {
      if (active) { objectUrl = URL.createObjectURL(r.data); setSrc(objectUrl); }
    }).catch(() => {});
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  const img = src ? <img src={src} alt={alt} width={128} height={128} className="h-32 w-32 max-w-full rounded-lg object-contain" /> : <span role="status">Cargando {alt}…</span>;
  return <div className="flex min-h-32 w-32 max-w-full flex-col gap-2">{img}{src && expandable && <button type="button" className="btn btn-secondary btn-sm w-full whitespace-normal break-words !px-2 !h-auto min-h-9" onClick={() => window.open(src, "_blank", "noopener,noreferrer")}>Ver imagen completa</button>}</div>;
}
