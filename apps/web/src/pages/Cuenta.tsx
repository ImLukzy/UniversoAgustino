import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type HubBazarItem, type HubDocument } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { careerLabel } from "../data/unsa";
import { paySummary } from "../lib/payments";
import { ROUTES } from "../lib/routes";
import { roleLabel } from "../lib/roles";
import { LoginRequired } from "../components/auth/LoginRequired";
import { ProfileForm } from "../components/cuenta/ProfileForm";

type Tab = "datos" | "cobro" | "sesion";
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "datos", icon: "school", label: "Datos académicos" },
  { id: "cobro", icon: "account_balance_wallet", label: "Cobro Yape/Plin" },
  { id: "sesion", icon: "security", label: "Sesión" },
];

// /cuenta: perfil académico, cobro y sesión.
export function Cuenta() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("datos");
  const docs = useQuery({ queryKey: ["docs-mine"], enabled: !!user, queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[] });
  const bazar = useQuery({ queryKey: ["bazar-mine"], enabled: !!user, queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[] });
  if (!user) return <LoginRequired what="ver tu cuenta" />;

  const items = [...(docs.data ?? []), ...(bazar.data ?? [])];
  const name = user.profile?.fullName?.trim() || user.email;
  const role = roleLabel(user.role);
  const out = async () => {
    await logout();
    window.location.href = ROUTES.home;
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <header className="card flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="price flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-primary text-4xl text-primary-ink">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="h-display text-2xl sm:text-3xl">{name}</h1>
              <span className="tag">{role}</span>
            </div>
            <p className="mt-1 truncate text-sm text-zinc-600">
              {user.email} · {careerLabel(user.profile?.career ?? "ENFERMERIA")}{user.profile?.cycle ? ` · Ciclo ${user.profile.cycle}` : ""}
            </p>
            <p className="text-xs text-zinc-500">{items.length} publicaciones</p>
          </div>
        </div>
        <Link to={ROUTES.publish} className="btn btn-primary">
          <span className="material-symbols-outlined text-lg">add_circle</span> Publicar material
        </Link>
      </header>

      <div role="tablist" aria-label="Secciones de la cuenta" className="flex gap-2 overflow-x-auto p-1">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`chip ${tab === t.id ? "chip-active" : ""}`}>
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "datos" && <ProfileForm user={user} roleLabel={role} />}
      {tab === "cobro" && (
        <section className="card flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold text-zinc-950">Cómo cobras tus ventas</h2>
            <span className="price text-xl text-primary">{paySummary(items)}</span>
          </div>
          <p className="text-sm text-zinc-600">
            {items.filter((i) => i.payQrUrl).length} de tus {items.length} publicaciones muestran QR de cobro. El método, titular y QR se configuran en cada publicación.
          </p>
          <p className="text-xs text-zinc-500">Los pagos van directo a tu Yape o Plin; el pedido queda en custodia hasta que el comprador confirma la entrega.</p>
          <Link to={ROUTES.myBazar} className="btn btn-primary w-fit">Configurar en Mis publicaciones</Link>
        </section>
      )}
      {tab === "sesion" && (
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="text-lg font-extrabold text-zinc-950">Sesión y acceso</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="card p-3"><dt className="text-xs text-zinc-500">Correo</dt><dd className="break-all font-bold">{user.email}</dd></div>
            <div className="card p-3"><dt className="text-xs text-zinc-500">Rol</dt><dd className="font-bold">{role}</dd></div>
          </dl>
          <p className="text-xs text-zinc-500">Tu sesión se mantiene en este dispositivo hasta que salgas.</p>
          <button type="button" onClick={out} className="btn btn-secondary w-fit text-[#b91c1c]">
            <span className="material-symbols-outlined text-base">logout</span> Cerrar sesión
          </button>
        </section>
      )}
    </main>
  );
}
