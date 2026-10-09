import { MetricCards } from "./MetricCards";

// Las denuncias abiertas ya salen en MetricCards; no se repiten en una tarjeta aparte.
export function ResumenTab() {
  return <MetricCards />;
}
