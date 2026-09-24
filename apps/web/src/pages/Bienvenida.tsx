import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";
import { SPRING } from "../lib/motion";
import { safeReturnPath } from "../lib/authRedirect";
import { RouteFallback } from "../components/RouteFallback";
import { OnboardingForm } from "../components/onboarding/OnboardingForm";

// /bienvenida: perfil obligatorio del primer ingreso (spec 21). Sin sesión
// vuelve al inicio; con el perfil ya completo, al destino (?next=).
export function Bienvenida() {
  const { user, loading, refreshMe } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = safeReturnPath(params.get("next")) ?? ROUTES.home;

  if (loading) return <RouteFallback />;
  if (!user) return <Navigate to={ROUTES.home} replace />;
  if (user.profile?.onboardedAt) return <Navigate to={next} replace />;

  const done = async () => {
    await refreshMe();
    nav(next, { replace: true });
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-10 sm:items-center">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        aria-labelledby="ob-title"
        className="card w-full max-w-xl p-6 sm:p-8"
      >
        <span className="material-symbols-outlined mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary-soft text-2xl text-primary" aria-hidden="true">
          school
        </span>
        <h1 id="ob-title" className="h-display text-2xl">Completa tu perfil agustino</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-600">
          Es tu primer ingreso. Estos datos son obligatorios para acceder a los recursos de estudio y al Bazar.
        </p>
        <OnboardingForm user={user} onDone={done} />
      </motion.section>
    </main>
  );
}
