import type { ReactNode } from "react";

// Marco común de las pantallas de cuenta fuera del modal (recuperar y
// restablecer contraseña): tarjeta centrada con título y bajada.
export function AuthPageShell({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-10">
      <div className="card flex flex-col gap-5 p-7">
        <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary-soft text-2xl text-primary">{icon}</span>
        <div>
          <h1 className="h-display text-2xl">{title}</h1>
          {sub && <p className="mt-1 text-sm text-zinc-600">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
