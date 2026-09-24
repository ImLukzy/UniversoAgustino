import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";

// Perfil obligatorio (spec 21): con sesión y sin perfil completo, cualquier
// ruta lleva a /bienvenida?next=<ruta>. Solo quedan libres el retorno OAuth
// y las páginas legales (el usuario debe poder leer los términos).
const FREE = [ROUTES.onboarding, ROUTES.authCallback, ROUTES.legal];

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const pending = !!user && !user.profile?.onboardedAt;
  if (pending && !FREE.some((p) => pathname.startsWith(p))) {
    return <Navigate to={`${ROUTES.onboarding}?next=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <>{children}</>;
}
