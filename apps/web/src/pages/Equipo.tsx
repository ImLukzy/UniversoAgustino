import { PayoutsTab } from "../components/equipo/PayoutsTab";
import { EarningsTab } from "../components/equipo/EarningsTab";
import { PaymentsTab } from "../components/equipo/PaymentsTab";
import { useSearchParams } from "react-router-dom";
import { PaymentAccountsTab } from "../components/equipo/PaymentAccountsTab";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PublicacionesTab } from "../components/equipo/PublicacionesTab";
import { useAuth } from "../auth/AuthContext";
import { LoginRequired } from "../components/auth/LoginRequired";
import { DenunciasTab } from "../components/equipo/DenunciasTab";
import { MiembrosTab } from "../components/equipo/MiembrosTab";
import { CasesTab } from "../components/equipo/CasesTab";
import { SedesTab } from "../components/equipo/SedesTab";
import { ResumenTab } from "../components/equipo/ResumenTab";
import { UsuariosTab } from "../components/equipo/UsuariosTab";
import { AgendaTab } from "../components/equipo/AgendaTab";

type Tab = "Pagos a vendedores" | "Completas" | "Ganancias" | "Pagos por verificar" | "Cuentas de cobro" | "Casos" | "Agenda" | "Resumen" | "Denuncias" | "Miembros" | "Usuarios" | "Publicaciones" | "Sedes y horarios";
export function Equipo() {
  const { user } = useAuth();
  const [search, setSearch] = useSearchParams();
  const candidate = search.get("tab");
  const tab = (candidate === "pagos" ? "Pagos por verificar" : candidate === "liquidaciones" ? "Pagos a vendedores" : candidate || "Resumen") as Tab;
  const setTab = (value: Tab) => setSearch({ tab: value === "Pagos por verificar" ? "pagos" : value === "Pagos a vendedores" ? "liquidaciones" : value });
  const reviews = useQuery({ queryKey: ["staff", "review-count", user?.id],
    enabled: user?.role === "admin" || user?.role === "moderator",
    queryFn: async () => (await api.get("/staff/reviews", { params: { pageSize: 1 } })).data as { pendingTotal: number } });
  if (!user) return <LoginRequired what="entrar al panel del equipo" />;
  if (user.role !== "moderator" && user.role !== "admin") return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="card p-8"><h1 className="h-display text-2xl">No tienes acceso al panel del equipo</h1></div>
    </div>
  );
  const tabs: Tab[] = user.role === "admin" ? ["Pagos por verificar", "Pagos a vendedores", "Completas", "Ganancias", "Cuentas de cobro", "Resumen", "Casos", "Agenda", "Usuarios", "Publicaciones", "Denuncias", "Miembros", "Sedes y horarios"] : ["Pagos por verificar", "Pagos a vendedores", "Completas", "Ganancias", "Cuentas de cobro", "Resumen", "Casos", "Agenda", "Usuarios", "Publicaciones", "Denuncias", "Sedes y horarios"];
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 px-4 py-8">
      <header><p className="eyebrow">Universo Agustino</p><h1 className="h-display text-3xl">Equipo</h1></header>
      <nav aria-label="Secciones del equipo" className="flex flex-wrap gap-2">
        {tabs.map((label) => <button key={label} type="button" aria-current={tab === label ? "page" : undefined}
          onClick={() => setTab(label)} className={`btn btn-sm ${tab === label ? "btn-primary" : "btn-secondary"}`}>{label}{label === "Publicaciones" && reviews.data ? ` (${reviews.data.pendingTotal})` : ""}</button>)}
      </nav>
      {tab === "Pagos por verificar" && <PaymentsTab />}
      {tab === "Pagos a vendedores" && <PayoutsTab />}
      {tab === "Completas" && <PayoutsTab completed />}
      {tab === "Ganancias" && <EarningsTab />}
      {tab === "Cuentas de cobro" && <PaymentAccountsTab />}
      {tab === "Sedes y horarios" && <SedesTab />}
      {tab === "Casos" && <CasesTab />}
      {tab === "Agenda" && <AgendaTab goCases={() => setTab("Casos")} />}
      {tab === "Usuarios" && <UsuariosTab />}
      {tab === "Resumen" && <ResumenTab />}
      {tab === "Publicaciones" && <PublicacionesTab />}
      {tab === "Denuncias" && <DenunciasTab />}
      {tab === "Miembros" && user.role === "admin" && <MiembrosTab />}
    </div>
  );
}
