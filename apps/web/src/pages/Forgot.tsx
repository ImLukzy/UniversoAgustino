import { useState } from "react";
import { Link } from "react-router-dom";
import { api, apiError } from "../lib/api";

// Recuperar contraseña (Sprint F1-01): pide el correo y el backend responde
// 202 neutro (sin confirmar si existe). Mensaje deliberadamente ambiguo:
// evita enumeración de cuentas.
export function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
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
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        Universo Agustino<span className="text-primary">.</span>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-slate-500">Escribe tu correo y te enviamos un enlace para crear una nueva.</p>
      </div>
      {!sent ? (
        <form onSubmit={onSubmit} autoComplete="off" className="flex w-full flex-col gap-3 text-left">
          <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Correo electrónico
            <span className="relative block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">mail</span>
              <input
                name="hub-email"
                className="input"
                style={{ borderRadius: "0.9rem", paddingTop: "0.85rem", paddingBottom: "0.85rem", paddingLeft: "2.75rem" }}
                placeholder="tu@unsa.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="off"
              />
            </span>
          </label>
          {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
          <button disabled={busy} className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60" style={{ background: "linear-gradient(90deg, rgb(var(--hub-p, 0 104 95)), rgb(var(--hub-p, 0 104 95) / 0.72))" }}>
            {busy ? "Enviando…" : "→  Enviarme el enlace"}
          </button>
        </form>
      ) : (
        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left" role="status">
          <p className="flex items-center gap-1 text-sm font-bold text-emerald-800">
            <span className="material-symbols-outlined text-base">mark_email_read</span>
            Revisa tu bandeja
          </p>
          <p className="mt-1 text-sm text-emerald-900">
            Si el correo está registrado, te enviamos un enlace. Revisa tu bandeja y spam. El enlace caduca en 30 minutos.
          </p>
        </div>
      )}
      <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
