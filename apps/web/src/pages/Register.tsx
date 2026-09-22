import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiError } from "../lib/api";
import { UNSA_CAREERS, careerOf } from "../data/unsa";

// Registro rediseñado v2 — comunidad UNSA-only.
// Panel institucional + formulario con validación @unsa.edu.pe en vivo,
// selector de carrera con color identidad, ciclo I–X y envío anti-duplicados.
const CYCLES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const PERKS = [
  { icon: "mail", title: "Correo @unsa.edu.pe", desc: "Verificamos que eres comunidad agustina." },
  { icon: "school", title: "15 carreras UNSA", desc: "Tu feed y colores según tu escuela." },
  { icon: "lock", title: "Compra en custodia", desc: "Yape o Plin, sin estafas entre compas." },
  { icon: "gavel", title: "D.L. 822", desc: "Solo material original, cero plagio." },
];

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", career: "ENFERMERIA", cycle: "VI" });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const email = form.email.trim().toLowerCase();
  // Excepción autorizada del propietario (igual que ALLOWED_EMAIL_EXCEPTIONS en el backend).
  const emailOk = email.endsWith("@unsa.edu.pe") || email === "lukas.melgar@tecsup.edu.pe";
  const pwOk = form.password.length >= 8;
  const faculty = careerOf(form.career)?.faculty ?? "UNSA";
  const careerColor = careerOf(form.career)?.color ?? "rgb(var(--hub-p, 0 104 95))";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Anti-duplicados: ignora envíos repetidos.
    if (sending.current) return;
    sending.current = true;
    setErr("");
    if (!emailOk) {
      setErr("Acceso exclusivo comunidad UNSA: usa tu correo @unsa.edu.pe");
      sending.current = false;
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, email, university: "UNSA" });
      nav("/");
    } catch (ex) {
      setErr(apiError(ex));
    } finally {
      setBusy(false);
      sending.current = false;
    }
  };

  return (
    <main className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#f2f3ff 0%,#faf8ff 45%,#e6f7f4 100%)" }}>
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "#14b8a6", opacity: 0.18 }}></div>
      <div className="absolute -bottom-28 -left-20 w-[26rem] h-[26rem] rounded-full blur-3xl pointer-events-none" style={{ background: "#6366f1", opacity: 0.16 }}></div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid overflow-hidden rounded-3xl shadow-2xl md:grid-cols-[1.05fr_1fr] bg-white">
          {/* Panel institucional */}
          <div className="relative flex flex-col gap-6 overflow-hidden p-8 text-white md:p-10" style={{ background: "linear-gradient(150deg,#07332f 0%,#0c4a44 55%,#2b2f7a 100%)" }}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: "#14b8a6", opacity: 0.35 }}></div>
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full blur-3xl" style={{ background: "#6366f1", opacity: 0.4 }}></div>
            <div className="relative flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-emerald-300">local_hospital</span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold tracking-tight">Universo Agustino</span>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Arequipa · UNSA</span>
              </div>
            </div>
            <div className="relative flex flex-col gap-2">
              <h2 className="font-display text-3xl font-bold leading-tight">Tu vida universitaria UNSA, en un solo lugar.</h2>
              <p className="text-sm leading-relaxed text-white/70">
                Apuntes verificados, bazar circular y monetización directa entre estudiantes agustinos.
              </p>
            </div>
            <ul className="relative flex flex-col gap-3">
              {PERKS.map((p) => (
                <li key={p.title} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <span className="material-symbols-outlined text-xl text-emerald-300">{p.icon}</span>
                  <span className="flex flex-col">
                    <span className="text-sm font-bold">{p.title}</span>
                    <span className="text-xs text-white/65">{p.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="relative mt-auto flex items-center gap-6 border-t border-white/15 pt-4 text-center">
              <div><p className="text-xl font-extrabold">+1,240</p><p className="text-[11px] text-white/60">descargas / mes</p></div>
              <div><p className="text-xl font-extrabold">15</p><p className="text-[11px] text-white/60">carreras UNSA</p></div>
              <div><p className="text-xl font-extrabold">100%</p><p className="text-[11px] text-white/60">legal D.L. 822</p></div>
            </div>
          </div>

          {/* Formulario */}
          <div className="flex flex-col gap-4 p-8 md:p-10">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">Crear cuenta</h1>
              <p className="mt-1 text-sm text-slate-500">Exclusivo comunidad <span className="font-bold text-primary">UNSA</span> · Rol inicial: creator.</p>
            </div>
            <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Nombre completo
                <input className="input" name="hub-fullname" autoComplete="off" placeholder="Ej. Rosa Quispe" value={form.fullName} onChange={set("fullName")} required minLength={2} />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Correo institucional
                <span className="relative block">
                  <input
                    className="input pr-10"
                    name="hub-email"
                    autoComplete="off"
                    placeholder="tucorreo@unsa.edu.pe"
                    value={form.email}
                    onChange={set("email")}
                    type="email"
                    required
                    style={form.email && !emailOk ? { borderColor: "#f87171", paddingRight: "2.5rem" } : { paddingRight: "2.5rem" }}
                  />
                  {form.email && (
                    <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 ${emailOk ? "text-emerald-600" : "text-red-400"}`}>
                      {emailOk ? "check_circle" : "error"}
                    </span>
                  )}
                </span>
                <span className={`text-xs font-medium ${!form.email || emailOk ? "text-slate-500" : "text-red-500"}`}>
                  {!form.email || emailOk ? "Usa tu correo @unsa.edu.pe para validar tu identidad agustina." : "Ese correo no es @unsa.edu.pe."}
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                Contraseña
                <span className="relative block">
                  <input
                    className="input pr-10"
                    name="hub-new-pass"
                    autoComplete="new-password"
                    style={{ paddingRight: "2.5rem" }}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={set("password")}
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                    <span className="material-symbols-outlined">{showPw ? "visibility_off" : "visibility"}</span>
                  </button>
                </span>
                {form.password && (
                  <span className={`text-xs font-medium ${pwOk ? "text-emerald-600" : "text-slate-500"}`}>
                    {pwOk ? "Contraseña válida." : `${8 - form.password.length} caracteres más…`}
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                  Carrera UNSA
                  <span className="relative block">
                    <span className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full" style={{ backgroundColor: careerColor }}></span>
                    <select className="input pl-8" style={{ paddingLeft: "2rem" }} value={form.career} onChange={set("career")} aria-label="Carrera UNSA">
                      {UNSA_CAREERS.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                  Ciclo
                  <select className="input" value={form.cycle} onChange={set("cycle")} aria-label="Ciclo">
                    {CYCLES.map((c) => (
                      <option key={c} value={c}>{c} ciclo</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="-mt-1 text-xs text-slate-500">{faculty}</p>
              {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
              <button
                disabled={busy}
                className="mt-1 w-full rounded-xl py-3 font-bold text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-60"
                style={{ background: "linear-gradient(90deg, rgb(var(--hub-p, 0 104 95)), #4648d4)" }}
              >
                {busy ? "Creando tu cuenta…" : "Registrarme gratis"}
              </button>
            </form>
            <p className="text-center text-sm text-slate-600">
              ¿Ya tienes cuenta? <Link className="font-bold text-primary underline" to="/login">Entra aquí</Link>
            </p>
            <p className="text-center">
              <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary hover:underline">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">Al registrarte aceptas el marco legal D.L. 822: solo material original.</p>
      </div>
    </main>
  );
}
