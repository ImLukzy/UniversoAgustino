import { useEffect, useState } from "react";
import { API_ORIGIN, api } from "../lib/api";
export function PrivateImage({ path, alt }: { path: string; alt: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true; let objectUrl = ""; setSrc("");
    void api.get<Blob>(`${API_ORIGIN}${path}`, { responseType: "blob", params: { stream: "1" } }).then((r) => {
      if (active) { objectUrl = URL.createObjectURL(r.data); setSrc(objectUrl); }
    }).catch(() => {});
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  return src ? <img src={src} alt={alt} width={128} height={128} className="h-32 w-32 max-w-full rounded-lg object-contain" /> : <span role="status">Cargando {alt}…</span>;
}
