import { useState } from "react";
import { api, apiError, resolveQr } from "../../lib/api";
import type { SaveSchedule, Sede } from "./sedeTypes";
const blank = { name: "", address: "", meetingPoint: "", photoUrl: "", active: true };
export function SedeForm({ sedes, save, busy }: { sedes: Sede[]; save: SaveSchedule; busy: boolean }) {
  const [uploading, setUploading] = useState(false); const [error, setError] = useState("");
  const [id, setId] = useState(""); const [form, setForm] = useState(blank);
  const field = (key: "name" | "address" | "meetingPoint" | "photoUrl", label: string, maxLength: number) =>
    <label className="flex min-w-0 flex-col gap-1 text-sm">{label}<input className="input w-full min-w-0" value={form[key]} required={key === "name"} maxLength={maxLength}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>;
  return <section className="card flex min-w-0 flex-col gap-4 p-5"><h2 className="font-bold">Sedes</h2>
    {sedes.map((s) => <div key={s.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b py-2">
      <span className="min-w-0 break-words text-sm">{s.name} · {s.active ? "Activa" : "Inactiva"}</span>
      <div className="flex flex-wrap gap-2"><button type="button" className="btn btn-secondary btn-sm" disabled={busy || uploading} onClick={() => {
        setId(s.id); setForm({ name: s.name, address: s.address, meetingPoint: s.meetingPoint, photoUrl: s.photoUrl ?? "", active: s.active });
      }}>Editar {s.name}</button>
      {s.active && <button type="button" disabled={busy || uploading} className="btn btn-secondary btn-sm" onClick={() => {
        if (window.confirm(`¿Desactivar ${s.name}?`)) void save("delete", `/staff/sedes/${s.id}`);
      }}>Desactivar</button>}</div>
    </div>)}
    <form className="flex min-w-0 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void save(id ? "patch" : "post", `/staff/sedes${id ? `/${id}` : ""}`,
      { ...form, photoUrl: form.photoUrl || null }).then((ok) => { if (ok) { setId(""); setForm(blank); } }); }}>
      <h3 className="font-bold">{id ? "Editar sede" : "Nueva sede"}</h3>
      {field("name", "Nombre", 100)}{field("address", "Dirección", 300)}{field("meetingPoint", "Punto de encuentro", 300)}
      <label className="flex min-w-0 flex-col gap-1 text-sm">Foto (opcional)<input type="file" accept="image/jpeg,image/png" disabled={busy || uploading} className="w-full min-w-0 text-sm" onChange={(e) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true); setError(""); const body = new FormData(); body.append("file", file);
        void api.post("/uploads", body, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => {
          setForm((current) => ({ ...current, photoUrl: String(r.data.data.url) }));
        }).catch((err) => setError(apiError(err))).finally(() => setUploading(false));
      }} /></label>
      {uploading && <p role="status">Subiendo foto…</p>}{error && <p role="alert">{error}</p>}
      {form.photoUrl && <div className="flex flex-wrap items-center gap-3"><img src={resolveQr(form.photoUrl) ?? undefined} alt="Foto de la sede" width={96} height={96} className="h-24 w-24 rounded-lg object-cover" />
        <button type="button" disabled={busy || uploading} className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, photoUrl: "" })}>Quitar foto</button></div>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />Activa</label>
      <div className="flex flex-wrap gap-2"><button disabled={busy || uploading} className="btn btn-primary" type="submit">Guardar sede</button>
      {id && <button type="button" className="btn btn-secondary" onClick={() => { setId(""); setForm(blank); }}>Cancelar edición</button>}</div>
    </form>
  </section>;
}
