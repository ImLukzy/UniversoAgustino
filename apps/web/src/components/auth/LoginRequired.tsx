import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../AuthModalHost";

// Pantalla para rutas privadas sin sesión: abre el modal sobre la MISMA página,
// así al entrar el usuario sigue donde estaba (sin redirecciones).
export function LoginRequired({ what }: { what: string }) {
  const { loading } = useAuth();
  const { openAuth } = useAuthModal();
  // Mientras se rehidrata la sesión: sin aviso falso de login y con la altura
  // reservada, para que el pie no salte al llegar el contenido (spec 15, A7).
  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)]" role="status" aria-label="Cargando sesión">
        <span className="sr-only">Cargando sesión…</span>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="card flex flex-col items-start gap-4 p-8">
        <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft text-2xl text-primary">lock</span>
        <div>
          <h1 className="h-display text-2xl">Inicia sesión para continuar</h1>
          <p className="mt-1 text-zinc-600">Necesitas tu cuenta @unsa.edu.pe para {what}.</p>
        </div>
        <button type="button" onClick={openAuth} className="btn btn-primary">Iniciar sesión</button>
      </div>
    </main>
  );
}
