import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { api, apiError } from "../lib/api";

// Restablece la contraseña con el token del enlace (?token=).
// Sin token: derivación honesta a /forgot. Token reusado/vencido (410):
// CTA para pedir un enlace nuevo.
export function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [expired, setExpired] = useState(false);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const rules = useMemo(
    () => [
      { label: "10+ caracteres", pass: password.length >= 10 },
      { label: "minúscula", pass: /[a-z]/.test(password) },
      { label: "mayúscula", pass: /[A-Z]/.test(password) },
      { label: "número", pass: /[0-9]/.test(password) },
    ],
    [password],
  );
  const strength = rules.filter((r) => r.pass).length;

  if (!token) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">
          Universo Agustino<span className="text-primary">.</span>
        </p>
        <div className="card w-full space-y-2 p-6">
          <h1 className="text-xl font-extrabold">Enlace inválido</h1>
          <p className="text-sm text-slate-500">Falta el token de recuperación en la URL.</p>
          <Link to="/forgot-password" className="btn-primary mt-2 inline-block px-4 py-2 text-sm">
            Solicitar un enlace nuevo
          </Link>
        </div>
      </main>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.post("/auth/reset", { token, password });
      setOk(true);
    } catch (ex) {
      const status = axios.isAxiosError(ex) ? ex.response?.status : undefined;
      if (status === 410) {
        setExpired(true);
      } else {
        setErr(apiError(ex));
      }
    } finally {
      setBusy(false);
    }
  };

  if (ok) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Contraseña actualizada</h1>
        <p className="text-sm text-slate-500">Tus otras sesiones se cerraron por seguridad. Entra con tu nueva contraseña.</p>
        <button onClick={() => nav("/login")} className="btn-primary w-full rounded-xl py-3 font-bold">
          Ir a iniciar sesión
        </button>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="material-symbols-outlined text-5xl text-amber-500">link_off</span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Enlace ya utilizado o vencido</h1>
        <p className="text-sm text-slate-500">Los enlaces caducan a los 30 minutos y son de un solo uso.</p>
        <Link to="/forgot-password" className="btn-primary w-full rounded-xl py-3 text-center font-bold">
          Solicitar un enlace nuevo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-14 text-center">
      <p className="text-2xl font-extrabold tracking-tight text-slate-900">
        Universo Agustino<span className="text-primary">.</span>
      </p>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Crea tu nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">Debe tener 10+ caracteres, minúscula, mayúscula y número.</p>
      </div>
      <form onSubmit={onSubmit} autoComplete="off" className="flex w-full flex-col gap-3 text-left">
        <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Nueva contraseña
          <span className="relative block">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">lock</span>
            <input
              className="input pr-11"
              style={{ borderRadius: "0.9rem", paddingTop: "0.85rem", paddingBottom: "0.85rem", paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              required
              minLength={10}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">{show ? "visibility_off" : "visibility"}</span>
            </button>
          </span>
        </label>
        <div className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength >= 4 ? "bg-emerald-500" : "bg-amber-400") : "bg-slate-200"}`} />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {rules.map((r) => (
            <li key={r.label} className={r.pass ? "font-semibold text-emerald-700" : "text-slate-400"}>
              {r.pass ? "✓" : "•"} {r.label}
            </li>
          ))}
        </ul>
        {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
        <button disabled={busy || strength < 4} className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60" style={{ background: "linear-gradient(90deg, rgb(var(--hub-p, 0 104 95)), rgb(var(--hub-p, 0 104 95) / 0.72))" }}>
          {busy ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
