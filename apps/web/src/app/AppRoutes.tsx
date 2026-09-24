import { lazy, useEffect } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { Explorar } from "../pages/Explorar";
import { useAuth } from "../auth/AuthContext";
import { Forgot } from "../pages/Forgot";
import { AppLayout } from "../components/AppLayout";
import { useAuthModal } from "../components/AuthModalHost";
import { RouteFallback } from "../components/RouteFallback";
import { ROUTES } from "../lib/routes";
import { safeReturnPath } from "../lib/authRedirect";
import { OnboardingGate } from "./OnboardingGate";

// Sprint 4 (F4-04): rutas pesadas en lazy (Visor arrastra pdfjs-dist).
// Eager solo home + auth (entradas).
const Bazar = lazy(() => import("../pages/Bazar").then((m) => ({ default: m.Bazar })));
const PublicLanding = lazy(() => import("../pages/PublicLanding").then((m) => ({ default: m.PublicLanding })));
const Home = lazy(() => import("../pages/Home").then((m) => ({ default: m.Home })));
const Monetiza = lazy(() => import("../pages/Monetiza").then((m) => ({ default: m.Monetiza })));
const Legal = lazy(() => import("../pages/Legal").then((m) => ({ default: m.Legal })));
const Balotarios = lazy(() => import("../pages/Balotarios").then((m) => ({ default: m.Balotarios })));
const Cuenta = lazy(() => import("../pages/Cuenta").then((m) => ({ default: m.Cuenta })));
const Pedidos = lazy(() => import("../pages/Pedidos").then((m) => ({ default: m.Pedidos })));
const Publicaciones = lazy(() => import("../pages/Publicaciones").then((m) => ({ default: m.Publicaciones })));
const Detalle = lazy(() => import("../pages/Detalle").then((m) => ({ default: m.Detalle })));
const Checkout = lazy(() => import("../pages/Checkout").then((m) => ({ default: m.Checkout })));
const Visor = lazy(() => import("../pages/Visor").then((m) => ({ default: m.Visor })));
const Panel = lazy(() => import("../pages/Panel").then((m) => ({ default: m.Panel })));
const Publicar = lazy(() => import("../pages/Publicar").then((m) => ({ default: m.Publicar })));
const Ventas = lazy(() => import("../pages/Ventas").then((m) => ({ default: m.Ventas })));
const Admin = lazy(() => import("../pages/Admin").then((m) => ({ default: m.Admin })));
const ResetPassword = lazy(() => import("../pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));
const Notificaciones = lazy(() => import("../pages/Notificaciones").then((m) => ({ default: m.Notificaciones })));
const Ajustes = lazy(() => import("../pages/Ajustes").then((m) => ({ default: m.Ajustes })));
const Suscripcion = lazy(() => import("../pages/Suscripcion").then((m) => ({ default: m.Suscripcion })));
const Perfil = lazy(() => import("../pages/Perfil").then((m) => ({ default: m.Perfil })));
const AuthCallback = lazy(() => import("../pages/AuthCallback").then((m) => ({ default: m.AuthCallback })));
const Bienvenida = lazy(() => import("../pages/Bienvenida").then((m) => ({ default: m.Bienvenida })));
const SubirMaterial = lazy(() => import("../pages/SubirMaterial").then((m) => ({ default: m.SubirMaterial })));

// /login y /register no son páginas: abren el modal global sobre el destino
// (?next=) o sobre el inicio. Tras entrar, el usuario sigue en esa página.
function LoginOpener({ tab = "login" }: { tab?: "login" | "register" }) {
  const { openAuth, openRegister } = useAuthModal();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  useEffect(() => {
    (tab === "register" ? openRegister : openAuth)();
    navigate(next ?? ROUTES.home, { replace: true });
  }, [openAuth, openRegister, navigate, next, tab]);
  return null;
}

// "/" depende de la sesión: visitantes ven la landing pública; con sesión,
// el marketplace. El catálogo público sigue en /explorar para todos.
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <RouteFallback />;
  return user ? <Explorar /> : <PublicLanding />;
}

export function AppRoutes() {
  return (
    <OnboardingGate>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/home" element={<Home />} />
        <Route path="/bazar" element={<Bazar />} />
        <Route path="/monetiza" element={<Monetiza />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/balotarios" element={<Balotarios />} />
        {/* Páginas de cuenta sobre el layout global */}
        <Route path="/login" element={<LoginOpener />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/bienvenida" element={<Bienvenida />} />
        <Route path="/register" element={<LoginOpener tab="register" />} />
        <Route path="/forgot-password" element={<AppLayout><Forgot /></AppLayout>} />
        <Route path="/reset-password" element={<AppLayout><ResetPassword /></AppLayout>} />
        <Route path="/cuenta" element={<AppLayout><Cuenta /></AppLayout>} />
        <Route path="/pedidos" element={<AppLayout><Pedidos /></AppLayout>} />
        <Route path="/publicaciones" element={<AppLayout><Publicaciones /></AppLayout>} />
        <Route path="/p/:type/:id" element={<AppLayout><Detalle /></AppLayout>} />
        <Route path="/v/:id" element={<AppLayout><Visor /></AppLayout>} />
        <Route path="/publicar" element={<AppLayout><Publicar /></AppLayout>} />
        <Route path="/panel" element={<AppLayout><Panel /></AppLayout>} />
        <Route path="/ventas" element={<AppLayout><Ventas /></AppLayout>} />
        <Route path="/checkout/:orderId" element={<AppLayout><Checkout /></AppLayout>} />
        <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="/suscripcion" element={<Suscripcion />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/subir-material" element={<SubirMaterial />} />
      </Routes>
    </OnboardingGate>
  );
}
