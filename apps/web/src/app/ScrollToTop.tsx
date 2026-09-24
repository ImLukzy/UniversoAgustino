import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Cada cambio de ruta empieza arriba (instantáneo: el scroll suave global es
// solo para anclas dentro de la misma página).
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
