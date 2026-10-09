import { useNavigate } from "react-router-dom";
import { PayoutsTab } from "../equipo/PayoutsTab";
import { EarningsTab } from "../equipo/EarningsTab";
import { PaymentsTab } from "../equipo/PaymentsTab";
import { PaymentAccountsTab } from "../equipo/PaymentAccountsTab";
import { PublicacionesTab } from "../equipo/PublicacionesTab";
import { DenunciasTab } from "../equipo/DenunciasTab";
import { MiembrosTab } from "../equipo/MiembrosTab";
import { CasesTab } from "../equipo/CasesTab";
import { SedesTab } from "../equipo/SedesTab";
import { ResumenTab } from "../equipo/ResumenTab";
import { UsuariosTab } from "../equipo/UsuariosTab";
import { AgendaTab } from "../equipo/AgendaTab";
import { panelPath, type PanelSlug } from "./navigation";
export function PanelSection({ slug }: { slug: PanelSlug }) {
  const navigate = useNavigate();
  switch (slug) {
    case "resumen": return <ResumenTab />;
    case "casos": return <CasesTab />;
    case "agenda": return <AgendaTab goCases={() => navigate(panelPath("casos"))} />;
    case "pagos-por-verificar": return <PaymentsTab />;
    case "pagos-a-vendedores": return <PayoutsTab />;
    case "completas": return <PayoutsTab completed />;
    case "ganancias": return <EarningsTab />;
    case "cuentas-de-cobro": return <PaymentAccountsTab />;
    case "publicaciones": return <PublicacionesTab />;
    case "denuncias": return <DenunciasTab />;
    case "usuarios": return <UsuariosTab />;
    case "sedes-y-horarios": return <SedesTab />;
    case "miembros": return <MiembrosTab />;
  }
}
