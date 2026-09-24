import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { api, apiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { FormMessage, PasswordInput, primaryBtn } from "../components/auth/fields";

// Mismas reglas que ResetSchema (@hub/shared).
const RULES = [
  { label: "10+ caracteres", test: (p: string) => p.length >= 10 },
  { label: "minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "número", test: (p: string) => /[0-9]/.test(p) },
];

// Restablece la contraseña con el token del enlace (?token=). Sin token o con
// token vencido/reusado (410), CTA honesto para pedir un enlace nuevo.
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [state, setState] = useState<"form" | "ok" | "expired">(token ? "form" : "expired");
  const [busy, setBusy] = useState(false);
  const passed = RULES.map((r) => r.test(password));
  const strength = passed.filter(Boolean).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.post("/auth/reset", { token, password });
      setState("ok");
    } catch (ex) {
      if (axios.isAxiosError(ex) && ex.response?.status === 410) setState("expired");
      else setErr(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  if (state === "ok") {
    return (
      <AuthPageShell icon="check_circle" title="Contraseña actualizada" sub="Tus otras sesiones se cerraron por seguridad. Entra con tu nueva contraseña.">
        <Link to={ROUTES.login} className={primaryBtn}>Ir a iniciar sesión</Link>
      </AuthPageShell>
    );
  }
  if (state === "expired") {
    return (
      <AuthPageShell icon="link_off" title="Enlace inválido o vencido" sub="Los enlaces caducan a los 30 minutos y son de un solo uso.">
        <Link to={ROUTES.forgotPassword} className={primaryBtn}>Solicitar un enlace nuevo</Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell icon="lock" title="Crea tu nueva contraseña" sub="Debe tener 10+ caracteres, minúscula, mayúscula y número.">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="reset-pw" className="text-xs font-bold text-zinc-700">Nueva contraseña</label>
        <PasswordInput id="reset-pw" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} autoComplete="new-password" placeholder="••••••••••" />
        <div className="mt-1 flex gap-1" aria-hidden="true">
          {RULES.map((r, i) => <span key={r.label} className={`h-1.5 flex-1 rounded-full ${i < strength ? "bg-primary" : "bg-zinc-200"}`} />)}
        </div>
        <ul className="flex flex-wrap gap-x-3 text-xs">
          {RULES.map((r, i) => <li key={r.label} className={passed[i] ? "font-bold text-zinc-950" : "text-zinc-500"}>{passed[i] ? "✓" : "•"} {r.label}</li>)}
        </ul>
        <FormMessage error={err} />
        <button disabled={busy || strength < RULES.length} className={primaryBtn}>{busy ? "Guardando…" : "Guardar nueva contraseña"}</button>
      </form>
    </AuthPageShell>
  );
}
