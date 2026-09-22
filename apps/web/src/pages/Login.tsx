import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiError } from "../lib/api";

// Login v3 — estilo limpio (referencia ReservaYa, identidad UNSA):
// sin valores precargados ni autocompletado, botón volver al inicio,
// sin caja de cuentas de prueba y envío anti-duplicados.
const AVATARS = [
  { init: "R", bg: "rgb(var(--hub-p, 0 104 95))" },
  { init: "M", bg: "#4648d4" },
  { init: "J", bg: "#b45309" },
  { init: "A", bg: "#be123c" },
  { init: "S", bg: "#7c3aed" },
];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  const clean = email.trim().toLowerCase();
  // Excepción autorizada del propietario (igual que ALLOWED_EMAIL_EXCEPTIONS en el backend).
  const emailOk = clean.endsWith("@unsa.edu.pe") || clean === "lukas.melgar@tecsup.edu.pe";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Anti-duplicados: ignora envíos repetidos (doble clic / Enter insistente).
    if (sending.current) return;
    sending.current = true;
    setErr("");
    setBusy(true);
    try {
      await login(clean, password);
      nav("/");
    } catch (ex) {
      setErr(apiError(ex));
    } finally {
      setBusy(false);
      sending.current = false;
    }
  };

  return (
    <main className="min-h-[60vh]" style={{ background: "#f4f6f8" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        {/* Marca */}
        <div className="flex flex-col justify-center gap-5">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-ua.svg" alt="Universo Agustino" width="55" height="44" className="h-11 w-auto" />
            <span className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Universo <span className="text-primary">Agustino</span>
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Bienvenido de <span className="text-primary">vuelta.</span>
          </h1>
          <p className="max-w-md leading-relaxed text-slate-500">
            Sigue donde lo dejaste: tus apuntes, tus pedidos en custodia y tu billetera agustina.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((a) => (
                <span key={a.init} className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white" style={{ backgroundColor: a.bg }}>
                  {a.init}
                </span>
              ))}
            </div>
            <p className="text-sm leading-tight text-slate-500">
              <span className="font-bold text-slate-800">+1,240 agustinos</span>
              <br />ya son parte de Universo Agustino
            </p>
          </div>
          <Link to="/" className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al inicio
          </Link>
        </div>

        {/* Formulario */}
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Inicia sesión</h2>
            <p className="mt-1 text-sm text-slate-500">Qué bueno verte de nuevo</p>
          </div>
          <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Correo electrónico
              <span className="relative block">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">mail</span>
                <input
                  name="hub-email"
                  className="input pl-11"
                  style={{ borderRadius: "0.9rem", paddingTop: "0.85rem", paddingBottom: "0.85rem", paddingLeft: "2.75rem" }}
                  placeholder="tu@unsa.edu.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="off"
                />
              </span>
              {email && !emailOk && <span className="text-xs font-medium normal-case tracking-normal text-red-500">Usa tu correo @unsa.edu.pe.</span>}
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Contraseña
              <span className="relative block">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-500">lock</span>
                <input
                  name="hub-pass"
                  className="input pl-11 pr-11"
                  style={{ borderRadius: "0.9rem", paddingTop: "0.85rem", paddingBottom: "0.85rem", paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                  <span className="material-symbols-outlined text-lg">{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </span>
            </label>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
            <button
              disabled={busy}
              className="w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60"
              style={{ background: "linear-gradient(90deg, rgb(var(--hub-p, 0 104 95)), rgb(var(--hub-p, 0 104 95) / 0.72))" }}
            >
              {busy ? "Entrando…" : "→  Iniciar sesión"}
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200"></span>
            ¿No tienes cuenta?
            <span className="h-px flex-1 bg-slate-200"></span>
          </div>
          <Link to="/register" className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-primary hover:text-primary">
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </main>
  );
}
