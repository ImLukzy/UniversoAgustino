import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, type HubBazarItem, type HubDocument } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { UNSA_CAREERS, careerLabel } from "../data/unsa";
import { careerContent } from "../data/careerContent";

const CYCLES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  moderator: "Moderador",
  creator: "Creador",
  student: "Estudiante",
};

type Tab = "datos" | "cobro" | "sesion";

export function Cuenta() {
  const { user, logout, refreshMe } = useAuth();
  const { career: themeCareer, accent } = useCareerTheme();
  const cc = careerContent(user?.profile?.career ?? themeCareer);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("datos");

  const [fullName, setFullName] = useState(user?.profile?.fullName ?? "");
  const [fCareer, setFCareer] = useState(user?.profile?.career ?? "ENFERMERIA");
  const [fCycle, setFCycle] = useState(user?.profile?.cycle ?? "");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [init, setInit] = useState(false);
  if (user && !init) {
    setInit(true);
    setFullName(user.profile?.fullName ?? "");
    setFCareer(user.profile?.career ?? "ENFERMERIA");
    setFCycle(user.profile?.cycle ?? "");
  }

  const docs = useQuery({
    queryKey: ["docs-mine"],
    queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[],
    enabled: !!user,
  });
  const bazar = useQuery({
    queryKey: ["bazar-mine"],
    queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[],
    enabled: !!user,
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para ver tu cuenta.
        </div>
      </main>
    );
  }

  const name = user.profile?.fullName?.trim() || user.email;
  const initial = name.charAt(0).toUpperCase();
  const myCareer = user.profile?.career ?? "ENFERMERIA";
  const methods = new Set<string>();
  [...(docs.data ?? []), ...(bazar.data ?? [])].forEach((i) => {
    const m = (i as { payMethod?: string | null }).payMethod ?? "YAPE";
    if (m === "AMBAS") {
      methods.add("Yape");
      methods.add("Plin");
    } else methods.add(m === "PLIN" ? "Plin" : "Yape");
  });
  const qrCount = [...(docs.data ?? []), ...(bazar.data ?? [])].filter(
    (i) => (i as { payQrUrl?: string | null }).payQrUrl
  ).length;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await api.patch("/auth/profile", { fullName: fullName.trim(), career: fCareer, cycle: fCycle.trim() || undefined });
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ["docs-mine"] });
      setSaveMsg("Datos guardados.");
    } catch (ex) {
      setSaveMsg(apiError(ex));
    } finally {
      setSaving(false);
    }
  };

  const out = async () => {
    await logout();
    window.location.href = "/";
  };

  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id: "datos", icon: "school", label: "Datos académicos" },
    { id: "cobro", icon: "account_balance_wallet", label: "Cobro Yape/Plin" },
    { id: "sesion", icon: "security", label: "Sesión y seguridad" },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Cabecera de perfil */}
      <div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-xl bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5"></div>
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <span
              className="flex h-24 w-24 items-center justify-center rounded-xl text-4xl font-extrabold text-white shadow-md sm:h-28 sm:w-28"
              style={{ backgroundColor: accent?.color ?? "rgb(var(--hub-p, 0 104 95))" }}
            >
              {initial}
            </span>
            {(user.role === "admin" || user.role === "moderator") && (
              <span className="absolute -bottom-2 -right-2 flex items-center justify-center rounded-full bg-emerald-700 p-1 text-white shadow-md" title="Perfil verificado">
                <span className="material-symbols-outlined text-base">verified</span>
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{name}</h1>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                <span className="material-symbols-outlined text-xs">verified</span> Cuenta UNSA
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <span className="material-symbols-outlined text-base text-primary" style={accent ? { color: accent.color } : undefined}>school</span>
              {user.email}
              <span className="text-slate-300">•</span>
              <span className="font-medium text-primary" style={accent ? { color: accent.color } : undefined}>
                {careerLabel(myCareer)}{user.profile?.cycle ? ` · Ciclo ${user.profile.cycle}` : ""}
              </span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm text-emerald-700">domain</span> UNSA Arequipa
              </span>
              <span className="flex items-center gap-0.5">
                <span className="material-symbols-outlined text-sm text-primary" style={accent ? { color: accent.color } : undefined}>storefront</span>
                {(docs.data?.length ?? 0) + (bazar.data?.length ?? 0)} publicaciones
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex w-full flex-row gap-2 sm:flex-row lg:w-auto lg:flex-col lg:items-end">
          <Link to="/publicar" className="flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm text-white shadow-sm transition-all hover:brightness-110 sm:w-auto" style={accent ? { backgroundColor: accent.color } : undefined}>
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Publicar material</span>
          </Link>
          <button onClick={() => window.print()} className="flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm transition-colors hover:bg-slate-200 sm:w-auto">
            <span className="material-symbols-outlined text-base">print</span>
            <span>Imprimir ficha</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm transition-all ${tab === t.id ? "bg-white font-bold text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            style={tab === t.id && accent ? { color: accent.color } : undefined}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          {tab === "datos" && (
            <div className="card flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>Información curricular</span>
                  <h2 className="font-display text-xl">Carrera y datos personales</h2>
                </div>
                <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span> Cuenta activa
                </span>
              </div>
              <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={save}>
                <label className="flex flex-col gap-1 text-sm">
                  Nombre completo
                  <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} minLength={2} maxLength={120} required />
                </label>
                <div className="flex flex-col gap-1 text-sm">
                  Correo (no editable)
                  <div className="input flex items-center justify-between bg-slate-50 text-slate-500">
                    <span className="truncate">{user.email}</span>
                    <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  </div>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  Carrera UNSA
                  <select className="input" value={fCareer} onChange={(e) => setFCareer(e.target.value)}>
                    {UNSA_CAREERS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <span className="text-xs font-normal text-slate-500">Define tu color y tu catálogo en toda la app.</span>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Ciclo
                  <select className="input" value={fCycle} onChange={(e) => setFCycle(e.target.value)}>
                    <option value="">—</option>
                    {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <div className="flex flex-col gap-1 text-sm">
                  Rol
                  <div className="input flex items-center justify-between bg-slate-50 text-slate-500">
                    <span>{ROLE_LABEL[user.role] ?? user.role}</span>
                    <span className="material-symbols-outlined text-base text-primary" style={accent ? { color: accent.color } : undefined}>shield_person</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  Universidad
                  <span className="font-bold">UNSA Arequipa</span>
                </div>
                <div className="flex items-center justify-end gap-2 md:col-span-2">
                  {saveMsg && <span className="mr-auto text-xs font-semibold text-slate-600">{saveMsg}</span>}
                  <button disabled={saving} type="submit" className="btn-primary flex items-center gap-1 text-sm disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>{saving ? "Guardando…" : "Guardar cambios"}</span>
                  </button>
                </div>
              </form>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Tus puntos de entrega</p>
                <div className="flex flex-wrap gap-1.5">
                  {cc.meetSpots.map((s) => (
                    <span key={s} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "cobro" && (
            <div className="card flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Medios de pago</span>
                  <h2 className="font-display text-xl">Cómo cobras tus ventas</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">
                  {methods.size > 0 ? [...methods].join(" / ") : "Sin configurar"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 shadow-sm">
                  <p className="font-bold">Yape / Plin en tus publicaciones</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {qrCount > 0
                      ? `${qrCount} de tus publicaciones ya muestran QR de cobro.`
                      : "Aún no subes tu QR. Los compradores verán tu número igualmente."}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{(docs.data?.length ?? 0) + (bazar.data?.length ?? 0)} publicaciones en total.</p>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-slate-50 p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Configura método, titular y QR por cada publicación.</p>
                  <Link to="/publicaciones" className="btn-primary mt-2 text-center text-sm" style={accent ? { backgroundColor: accent.color } : undefined}>
                    Configurar en Mi Bazar
                  </Link>
                </div>
              </div>
              <p className="text-xs text-slate-500">Los pagos van directo a tu Yape/Plin. Universo Agustino solo custodia hasta la confirmación de entrega.</p>
            </div>
          )}

          {tab === "sesion" && (
            <div className="card flex flex-col gap-4 p-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>Seguridad</span>
                <h2 className="font-display text-xl">Sesión y acceso</h2>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Correo</dt><dd className="break-all font-semibold">{user.email}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Rol</dt><dd className="font-semibold">{ROLE_LABEL[user.role] ?? user.role}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Carrera</dt><dd className="font-semibold">{user.profile?.career ? careerLabel(user.profile.career) : "—"}</dd></div>
                <div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-500">Miembro desde</dt><dd className="font-semibold">Universo Agustino</dd></div>
              </dl>
              <p className="text-xs text-slate-500">Tu sesión se mantiene en este dispositivo hasta que salgas.</p>
              <button onClick={out} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100">
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Cerrar sesión segura</span>
              </button>
            </div>
          )}
        </div>

        {/* Rail derecho */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <div
            className="relative flex flex-col items-center overflow-hidden rounded-xl p-5 text-center text-white shadow-md"
            style={{ background: accent ? `linear-gradient(to bottom, ${accent.color}, ${accent.color}DD)` : undefined }}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl"></div>
            <div className="z-10 mb-3 flex w-full items-center justify-between">
              <span className="flex items-center gap-1 text-sm font-extrabold tracking-tight">
                <span className="material-symbols-outlined text-xl">school</span> Carnet Agustino
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] backdrop-blur-sm">Arequipa</span>
            </div>
            <span
              className="z-10 mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-white/30 text-4xl font-extrabold"
            >
              {initial}
            </span>
            <h3 className="z-10 font-display text-lg font-extrabold leading-tight">{name}</h3>
            <p className="z-10 mt-0.5 text-xs text-white/80">
              {user.profile?.career ? careerLabel(user.profile.career) : "Universo Agustino"}{user.profile?.cycle ? ` · Ciclo ${user.profile.cycle}` : ""}
            </p>
            <p className="z-10 mt-1 rounded-full bg-white/15 px-3 py-0.5 font-mono text-[11px] text-white/90">ID: UA-{user.id.slice(0, 5).toUpperCase()}</p>
            <div className="z-10 mt-3 flex w-full flex-col items-center gap-1 rounded-xl bg-white p-3 text-slate-800 shadow-md">
              <span className="material-symbols-outlined text-4xl text-primary" style={accent ? { color: accent.color } : undefined}>qr_code_2</span>
              <span className="text-[11px] text-slate-500">Muestra tu panel para validar tu cuenta</span>
            </div>
            <p className="z-10 mt-2 text-center text-[11px] leading-relaxed text-white/70">
              Punto de entrega: {cc.meetSpots[0]}
            </p>
            <button onClick={() => window.print()} className="z-10 mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-white py-2 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-slate-50" style={accent ? { color: accent.color } : undefined}>
              <span className="material-symbols-outlined text-base">file_download</span>
              <span>Imprimir carnet</span>
            </button>
          </div>

          <div className="card flex flex-col gap-2 p-4">
            <h3 className="font-bold">Puntos de intercambio</h3>
            <p className="text-xs text-slate-500">Zonas autorizadas para transacción segura:</p>
            <div className="mt-1 flex flex-col gap-1.5">
              {cc.meetSpots.map((s, i) => (
                <div key={s} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 transition-colors hover:bg-slate-100">
                  <span className="material-symbols-outlined text-xl text-primary" style={{ color: ["", "", "#4648d4"][i] || (accent?.color ?? "rgb(var(--hub-p, 0 104 95))") }}>
                    {i < 2 ? "map" : "local_hospital"}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-semibold">{s}</span>
                    <span className="truncate text-[11px] text-slate-500">{cc.meetTimes[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
