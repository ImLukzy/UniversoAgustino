import { useState } from "react";
import { Link } from "react-router-dom";

// Recuperar contraseña — UI lista; el envío automático aún está en camino,
// así que el flujo es honesto: valida tu @unsa.edu.pe y te orienta.
export function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith("@unsa.edu.pe")) {
      setErr("Usa tu correo @unsa.edu.pe.");
      setMsg("");
      return;
    }
    setMsg("La recuperación automática aún está en camino. Si no puedes entrar, verifica tu correo o crea tu cuenta de nuevo con tu @unsa.edu.pe.");
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        Wawki<span style={{ color: "#0d9488" }}>.</span>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">¿Olvidaste tu contraseña?</h1>
        <p className="mt-1 text-sm text-slate-500">Escribe tu correo y te orientamos para crear una nueva.</p>
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
        {msg && <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">{msg}</p>}
        <button className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:brightness-110" style={{ background: "linear-gradient(90deg,#0d9488,#0a5f58)" }}>
          →  Enviarme el enlace
        </button>
      </form>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
