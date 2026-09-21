import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarketplaceStitch } from "./stitch/MarketplaceStitch";
import { AuthProvider } from "./auth/AuthContext";
import { CareerThemeProvider } from "./live/careerTheme";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Forgot } from "./pages/Forgot";
import { StitchLayout } from "./components/StitchLayout";
import { PanelLayout } from "./components/PanelLayout";
import { ToastProvider } from "./context/ToastContext";
import { RouteFallback } from "./components/RouteFallback";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";

// Sprint 4 (F4-04): rutas pesadas en lazy (Visor arrastra pdfjs-dist).
// Eager solo home + auth (entradas). Fallback con skeletons + boundary
// con mensaje de recarga si un chunk falla.
const BazarStitch = lazy(() => import("./stitch/BazarStitch").then((m) => ({ default: m.BazarStitch })));
const MonetizaStitch = lazy(() => import("./stitch/MonetizaStitch").then((m) => ({ default: m.MonetizaStitch })));
const LegalStitch = lazy(() => import("./stitch/LegalStitch").then((m) => ({ default: m.LegalStitch })));
const Cuenta = lazy(() => import("./pages/Cuenta").then((m) => ({ default: m.Cuenta })));
const Pedidos = lazy(() => import("./pages/Pedidos").then((m) => ({ default: m.Pedidos })));
const Publicaciones = lazy(() => import("./pages/Publicaciones").then((m) => ({ default: m.Publicaciones })));
const Detalle = lazy(() => import("./pages/Detalle").then((m) => ({ default: m.Detalle })));
const Checkout = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.Checkout })));
const Visor = lazy(() => import("./pages/Visor").then((m) => ({ default: m.Visor })));
const Panel = lazy(() => import("./pages/Panel").then((m) => ({ default: m.Panel })));
const Publicar = lazy(() => import("./pages/Publicar").then((m) => ({ default: m.Publicar })));
const Ventas = lazy(() => import("./pages/Ventas").then((m) => ({ default: m.Ventas })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      // Sprint 2A: 5 min sin refetch al enfocar (los badges con
      // refetchInterval propio siguen actualizándose solos).
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

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
        <ToastProvider>
        <BrowserRouter>
          <StitchNavBridge />
          {/* Clases del <body> original de Stitch */}
          <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
            <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<MarketplaceStitch />} />
              <Route path="/bazar" element={<BazarStitch />} />
              <Route path="/monetiza" element={<MonetizaStitch />} />
              <Route path="/legal" element={<LegalStitch />} />
              {/* Páginas de cuenta: misma barra superior principal y pie del sitio */}
              <Route path="/login" element={<StitchLayout><Login /></StitchLayout>} />
              <Route path="/register" element={<StitchLayout><Register /></StitchLayout>} />
              <Route path="/forgot-password" element={<StitchLayout><Forgot /></StitchLayout>} />
              <Route path="/reset-password" element={<StitchLayout><ResetPassword /></StitchLayout>} />
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
            </Suspense>
            </RouteErrorBoundary>
          </div>
        </BrowserRouter>
        </ToastProvider>
        </CareerThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
