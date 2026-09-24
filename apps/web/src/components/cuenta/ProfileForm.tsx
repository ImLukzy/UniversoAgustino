import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError, type HubUser } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { UNSA_CAREERS } from "../../data/unsa";
import { CYCLES } from "../../lib/publishing";
import { fieldLabel } from "../publicar/StepDetails";

// Datos académicos editables (PATCH /auth/profile). El correo y el rol no se editan.
export function ProfileForm({ user, roleLabel }: { user: HubUser; roleLabel: string }) {
  const { refreshMe } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ fullName: user.profile?.fullName ?? "", career: user.profile?.career ?? "ENFERMERIA", cycle: user.profile?.cycle ?? "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api.patch("/auth/profile", { fullName: f.fullName.trim(), career: f.career, cycle: f.cycle.trim() || undefined });
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ["docs-mine"] });
      setMsg("Datos guardados.");
    } catch (ex) {
      setMsg(apiError(ex));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card grid gap-4 p-6 md:grid-cols-2">
      <h2 className="text-lg font-extrabold text-zinc-950 md:col-span-2">Carrera y datos personales</h2>
      <label className={fieldLabel}>
        Nombre completo
        <input className="input" value={f.fullName} onChange={(e) => setF((s) => ({ ...s, fullName: e.target.value }))} minLength={2} maxLength={120} required />
      </label>
      <label className={fieldLabel}>
        Correo (no editable)
        <input className="input bg-zinc-50 text-zinc-500" value={user.email} readOnly />
      </label>
      <label className={fieldLabel}>
        Carrera UNSA
        <select className="input" value={f.career} onChange={(e) => setF((s) => ({ ...s, career: e.target.value }))}>
          {UNSA_CAREERS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <span className="text-xs font-normal text-zinc-500">Define tu color y tu catálogo en toda la app.</span>
      </label>
      <label className={fieldLabel}>
        Ciclo
        <select className="input" value={f.cycle} onChange={(e) => setF((s) => ({ ...s, cycle: e.target.value }))}>
          <option value="">—</option>
          {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className={fieldLabel}>
        Rol
        <input className="input bg-zinc-50 text-zinc-500" value={roleLabel} readOnly />
      </label>
      <div className="flex items-end justify-end gap-3 md:col-span-2">
        <p role="status" className="mr-auto text-xs font-bold text-zinc-700">{msg}</p>
        <button disabled={saving} type="submit" className="btn btn-primary">
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
