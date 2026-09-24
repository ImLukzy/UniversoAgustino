import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { FormMessage, inputCls, primaryBtn } from "../components/auth/fields";

// Recuperar contraseña (Sprint F1-01): el backend responde 202 neutro (sin
// confirmar si el correo existe) para evitar la enumeración de cuentas.
export function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.post("/auth/forgot", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (ex) {
      setErr(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthPageShell icon="mail" title="¿Olvidaste tu contraseña?" sub="Escribe tu correo y te enviamos un enlace para crear una nueva.">
      {sent ? (
        <p role="status" className="rounded-xl border-2 border-zinc-900 bg-[#dcfce7] p-4 text-sm text-zinc-900">
          <b>Revisa tu bandeja.</b> Si el correo está registrado, te enviamos un enlace (revisa también spam). Caduca en 30 minutos.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor="forgot-email" className="text-xs font-bold text-zinc-700">Correo institucional</label>
          <input id="forgot-email" className={inputCls} placeholder="tu@unsa.edu.pe" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
          <FormMessage error={err} />
          <button disabled={busy} className={primaryBtn}>{busy ? "Enviando…" : "Enviarme el enlace"}</button>
        </form>
      )}
      <Link to={ROUTES.login} className="btn-ghost w-fit px-2">
        <span className="material-symbols-outlined text-base">arrow_back</span> Volver a iniciar sesión
      </Link>
    </AuthPageShell>
  );
}
