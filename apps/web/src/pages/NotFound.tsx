import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";

const TITLE = "Esta página no existe";
const HELP = "Puede que el enlace esté mal escrito o que la página se haya movido.";

export function NotFound() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Página no encontrada · Universo Agustino";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
        <EmptyState
          icon="search_off"
          title={TITLE}
          titleAs="h1"
          titleClassName="h-display text-3xl"
          hint={HELP}
          action={(
            <nav aria-label="Opciones para continuar" className="flex flex-col gap-2 sm:flex-row">
              <Link to="/" className="btn btn-primary">Ir al inicio</Link>
              <Link to="/explorar" className="btn btn-secondary">Explorar apuntes</Link>
            </nav>
          )}
        />
      </div>
    </AppLayout>
  );
}
