import { Navigate, useSearchParams } from "react-router-dom";
import { legacyPanelPath } from "../components/teamPanel/navigation";
// Preserve old notification/bookmark destinations, including payment aliases.
export function Equipo() {
  const [search] = useSearchParams();
  return <Navigate to={legacyPanelPath(search.get("tab"))} replace />;
}
