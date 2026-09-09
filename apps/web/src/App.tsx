import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarketplaceStitch } from "./stitch/MarketplaceStitch";
import { BazarStitch } from "./stitch/BazarStitch";
import { MonetizaStitch } from "./stitch/MonetizaStitch";
import { LegalStitch } from "./stitch/LegalStitch";
import { AuthProvider } from "./auth/AuthContext";
import { CareerThemeProvider } from "./live/careerTheme";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Forgot } from "./pages/Forgot";
import { Cuenta } from "./pages/Cuenta";
import { Pedidos } from "./pages/Pedidos";
import { Admin } from "./pages/Admin";
import { AuthLayout } from "./components/SiteChrome";

const qc = new QueryClient();

// Los headers Stitch navegan con <a data-path="slug" href="#">.
// Este puente los convierte en navegación SPA sin tocar el diseño.
const PATH_MAP: Record<string, string> = {
  "explorar-marketplace": "/",
  "bazar-y-alquiler": "/bazar",
  "vender-y-monetizar": "/monetiza",
  "marco-legal-y-etica-academica": "/legal",
  "membresia-semestral": "/monetiza",
  "soporte-guardias": "/legal",
};

function StitchNavBridge() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const a = el.closest?.("a[data-path]") as HTMLAnchorElement | null;
      if (!a) return;
      const to = PATH_MAP[a.getAttribute("data-path") ?? ""];
      if (!to) return;
      e.preventDefault();
      if (to !== pathname) navigate(to);
      else window.scrollTo({ top: 0, behavior: "smooth" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate, pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function LegalConFuncional() {
  return <LegalStitch />;
}

export function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <CareerThemeProvider>
        <BrowserRouter>
          <StitchNavBridge />
          {/* Clases del <body> original de Stitch */}
          <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
            <Routes>
              <Route path="/" element={<MarketplaceStitch />} />
              <Route path="/bazar" element={<BazarStitch />} />
              <Route path="/monetiza" element={<MonetizaStitch />} />
              <Route path="/legal" element={<LegalConFuncional />} />
              {/* Páginas de cuenta: siempre con barra superior e inferior */}
              <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
              <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
              <Route path="/forgot-password" element={<AuthLayout><Forgot /></AuthLayout>} />
              <Route path="/cuenta" element={<AuthLayout><Cuenta /></AuthLayout>} />
              <Route path="/pedidos" element={<AuthLayout><Pedidos /></AuthLayout>} />
              <Route path="/admin" element={<AuthLayout><Admin /></AuthLayout>} />
            </Routes>
          </div>
        </BrowserRouter>
        </CareerThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
