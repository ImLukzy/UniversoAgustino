import { useState } from "react";
import { Link } from "react-router-dom";

// Recuperar contraseña — sin endpoint de mailing en el backend, el flujo es
// honesto: valida tu @unsa.edu.pe y te muestra instrucciones de soporte.
// No promete ningún enlace por correo.
export function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [shown, setShown] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith("@unsa.edu.pe")) {
      setErr("Usa tu correo @unsa.edu.pe.");
      setShown(false);
      return;
    }
    setShown(true);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        Universo Agustino<span className="text-primary">.</span>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-slate-500">Aún no enviamos enlaces automáticos. Te mostramos cómo recuperar tu acceso.</p>
      </div>
      <form onSubmit={onSubmit} autoComplete="off" className="flex w-full flex-col gap-3 text-left">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Correo electrónico
          <span className="relative block">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">mail</span>
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
        <button className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:brightness-110" style={{ background: "linear-gradient(90deg, rgb(var(--hub-p, 0 104 95)), rgb(var(--hub-p, 0 104 95) / 0.72))" }}>
          →  Ver cómo recuperar acceso
        </button>
      </form>
      {shown && (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
          <p className="flex items-center gap-1 text-sm font-bold text-slate-800">
            <span className="material-symbols-outlined text-base text-primary">support_agent</span>
            Recupera tu acceso a {email.trim().toLowerCase()}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Verifica que el correo esté bien escrito y vuelve a intentarlo en <Link className="font-bold text-primary hover:underline" to="/login">iniciar sesión</Link>.</li>
            <li>Si creaste tu cuenta con otro correo @unsa.edu.pe, prueba con ese.</li>
            <li>Si nada funciona, crea tu cuenta de nuevo con tu @unsa.edu.pe desde <Link className="font-bold text-primary hover:underline" to="/register">registro</Link>.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-400">El envío automático de enlaces de recuperación aún está en camino.</p>
        </div>
      )}
      <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
