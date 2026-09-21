import { Component } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// Si un chunk lazy falla (deploy nuevo a mitad de navegación, red caída),
// mensaje de recarga en vez de pantalla en blanco (Sprint 4).
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card space-y-2 p-6 text-center">
          <p className="font-bold">Hay una versión nueva disponible.</p>
          <p className="text-sm text-slate-500">La página no pudo cargarse. Recarga para obtener la última versión.</p>
          <div className="flex justify-center gap-2 pt-2">
            <button onClick={() => window.location.reload()} className="btn-primary px-4 py-2 text-sm">
              Recargar
            </button>
            <Link to="/" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold">
              Ir al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
