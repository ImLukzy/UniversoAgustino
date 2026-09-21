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
import { Publicaciones } from "./pages/Publicaciones";
import { Detalle } from "./pages/Detalle";
import { Checkout } from "./pages/Checkout";
import { Visor } from "./pages/Visor";
import { Panel } from "./pages/Panel";
import { Publicar } from "./pages/Publicar";
import { Ventas } from "./pages/Ventas";
import { Admin } from "./pages/Admin";
import { StitchLayout } from "./components/StitchLayout";
import { PanelLayout } from "./components/PanelLayout";

const qc = new QueryClient();

// Los headers Stitch navegan con <a data-path="slug" href="#">.
// Este puente los convierte en navegación SPA sin tocar el diseño.
const PATH_MAP: Record<string, string> = {
  "explorar-marketplace": "/",
  "bazar-y-alquiler": "/bazar",
  "vender-y-monetizar": "/monetiza",
  "marco-legal-y-etica-academica": "/legal",
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
              <Route path="/legal" element={<LegalStitch />} />
              {/* Páginas de cuenta: misma barra superior principal y pie del sitio */}
              <Route path="/login" element={<StitchLayout><Login /></StitchLayout>} />
              <Route path="/register" element={<StitchLayout><Register /></StitchLayout>} />
              <Route path="/forgot-password" element={<StitchLayout><Forgot /></StitchLayout>} />
              <Route path="/cuenta" element={<PanelLayout><Cuenta /></PanelLayout>} />
              <Route path="/pedidos" element={<PanelLayout><Pedidos /></PanelLayout>} />
              <Route path="/publicaciones" element={<PanelLayout><Publicaciones /></PanelLayout>} />
              <Route path="/p/:type/:id" element={<StitchLayout><Detalle /></StitchLayout>} />
              <Route path="/v/:id" element={<StitchLayout><Visor /></StitchLayout>} />
              <Route path="/publicar" element={<StitchLayout><Publicar /></StitchLayout>} />
              <Route path="/panel" element={<PanelLayout><Panel /></PanelLayout>} />
              <Route path="/ventas" element={<PanelLayout><Ventas /></PanelLayout>} />
              <Route path="/checkout/:orderId" element={<StitchLayout><Checkout /></StitchLayout>} />
              <Route path="/admin" element={<PanelLayout><Admin /></PanelLayout>} />
            </Routes>
          </div>
        </BrowserRouter>
        </CareerThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
