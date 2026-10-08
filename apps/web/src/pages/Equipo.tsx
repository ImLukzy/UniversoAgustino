import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PublicacionesTab } from "../components/equipo/PublicacionesTab";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { LoginRequired } from "../components/auth/LoginRequired";
import { DenunciasTab } from "../components/equipo/DenunciasTab";
import { MiembrosTab } from "../components/equipo/MiembrosTab";
import { ResumenTab } from "../components/equipo/ResumenTab";

type Tab = "Resumen" | "Denuncias" | "Miembros" | "Publicaciones";
export function Equipo() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Resumen");
  const reviews = useQuery({ queryKey: ["staff", "review-count", user?.id],
    enabled: user?.role === "admin" || user?.role === "moderator",
    queryFn: async () => (await api.get("/staff/reviews", { params: { pageSize: 1 } })).data as { pendingTotal: number } });
  if (!user) return <LoginRequired what="entrar al panel del equipo" />;
  if (user.role !== "moderator" && user.role !== "admin") return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="card p-8"><h1 className="h-display text-2xl">No tienes acceso al panel del equipo</h1></div>
    </main>
  );
  const tabs: Tab[] = user.role === "admin" ? ["Resumen", "Publicaciones", "Denuncias", "Miembros"] : ["Resumen", "Publicaciones", "Denuncias"];
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 px-4 py-8">
      <header><p className="eyebrow">Universo Agustino</p><h1 className="h-display text-3xl">Equipo</h1></header>
      <nav aria-label="Secciones del equipo" className="flex flex-wrap gap-2">
        {tabs.map((label) => <button key={label} type="button" aria-current={tab === label ? "page" : undefined}
          onClick={() => setTab(label)} className={`btn btn-sm ${tab === label ? "btn-primary" : "btn-secondary"}`}>{label}{label === "Publicaciones" && reviews.data ? ` (${reviews.data.pendingTotal})` : ""}</button>)}
      </nav>
      {tab === "Resumen" && <ResumenTab />}
      {tab === "Publicaciones" && <PublicacionesTab />}
      {tab === "Denuncias" && <DenunciasTab />}
      {tab === "Miembros" && user.role === "admin" && <MiembrosTab />}
    </main>
  );
}
