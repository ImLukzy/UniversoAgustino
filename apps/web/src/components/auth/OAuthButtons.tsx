import { useState } from "react";
import { API_BASE } from "../../lib/api";
import { rememberReturnTo } from "../../lib/authRedirect";
import { useToast } from "../../context/ToastContext";

export type OAuthStatus = { google: boolean; apple: boolean };

const GOOGLE = (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);
const APPLE = (
  <svg className="h-4 w-4 shrink-0 fill-current text-zinc-900" viewBox="0 0 170 170" aria-hidden="true">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.32-2.62-7.21-7.25-11.68-13.89-6.85-10.08-12.3-21.2-16.35-33.36-4.05-12.16-6.08-23.32-6.08-33.48 0-14.75 3.73-26.68 11.19-35.8 7.46-9.12 16.82-13.78 28.08-13.98 4.8 0 10.12 1.2 15.96 3.6 5.84 2.4 9.68 3.6 11.52 3.6 1.5 0 5.42-1.28 11.76-3.84 6.34-2.56 11.54-3.71 15.6-3.46 12.33.6 22.25 5.12 29.76 13.56-10.98 6.66-16.34 15.9-16.08 27.72.26 9.3 3.93 17.06 11.01 23.28 7.08 6.22 15.42 9.68 25.02 10.38-2.52 7.56-5.91 15.22-10.17 22.98zM119.22 31.84c0-7.22 2.62-14.31 7.86-21.28 5.24-6.97 11.83-10.89 19.78-11.76.13 1.07.2 2.01.2 2.83 0 7.08-2.69 14.19-8.07 21.32-5.38 7.13-11.95 11.06-19.71 11.78-.06-.82-.06-1.78-.06-2.89z" />
  </svg>
);
const PROVIDERS = [
  { id: "google", label: "Continuar con Google (Correo UNSA)", name: "Google", icon: GOOGLE },
  { id: "apple", label: "Continuar con Apple", name: "Apple", icon: APPLE },
] as const;

// Única vía de ingreso: OAuth con puerta @unsa.edu.pe en el backend. Ambos
// botones se muestran siempre (sin CLS); si /auth/oauth/status dice que un
// proveedor no está configurado, el clic avisa en vez de ir a un 503.
export function OAuthButtons({ status }: { status: OAuthStatus | null }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={busy !== null}
          onClick={() => {
            if (!status?.[p.id]) return void toast.info(`Ingreso con ${p.name} aún no disponible`, "Intenta con otro método o vuelve más tarde.");
            setBusy(p.id);
            rememberReturnTo();
            window.location.assign(`${API_BASE}/auth/oauth/${p.id}`);
          }}
          className="btn btn-secondary btn-lg w-full gap-2 px-3 text-[13px] sm:gap-3 sm:text-sm"
        >
          {p.icon}
          {busy === p.id ? "Conectando…" : p.label}
        </button>
      ))}
    </div>
  );
}
