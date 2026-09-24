import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { LoginRequired } from "../components/auth/LoginRequired";
import { ProfileForm } from "../components/cuenta/ProfileForm";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";
import { roleLabel } from "../lib/roles";

// Ajustes: solo lo que el backend permite (PATCH /auth/profile) + recuperación
// de contraseña. Sin idioma, cuentas vinculadas ni borrado: no existen.
export function Ajustes() {
  const { user } = useAuth();
  if (!user) return <AppLayout><LoginRequired what="ajustar tu cuenta" /></AppLayout>;
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header>
          <p className="eyebrow">Cuenta</p>
          <h1 className="h-display mt-2 text-3xl">Ajustes</h1>
        </header>
        <ProfileForm user={user} roleLabel={roleLabel(user.role)} />
        <section className="card flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-extrabold text-zinc-950">Contraseña</h2>
          <p className="text-sm text-zinc-600">Si olvidaste tu clave, genera un enlace de recuperación en tu correo.</p>
          <Link to={ROUTES.forgotPassword} className="btn btn-secondary">Recuperar contraseña</Link>
        </section>
      </div>
    </AppLayout>
  );
}
