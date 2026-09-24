import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, setAccessToken } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ROUTES } from "../lib/routes";
import { takeReturnTo } from "../lib/authRedirect";
import { useAuth } from "../auth/AuthContext";

// Retorno del OAuth social: /auth/callback?code=... (éxito) o ?error=CODE.
// Canjea el código por access, carga la sesión y vuelve a la página de origen.
// Mensajes de error en español, incluido el de dominio denegado.
const ERROR_MSG: Record<string, string> = {
  EMAIL_NO_AUTORIZADO: "Acceso denegado: usa tu cuenta institucional @unsa.edu.pe. Universo Agustino es exclusivo para la comunidad UNSA.",
  EMAIL_NO_VERIFICADO: "Tu proveedor no confirmó que el correo esté verificado. Verifícalo e intenta de nuevo.",
  OAUTH_NO_CONFIGURADO: "Ese método de ingreso aún no está disponible.",
  TOKEN_INVALIDO: "No pudimos validar tu identidad. Intenta de nuevo.",
  PROVEEDOR_DISTINTO: "Ese correo ya usa otro método de ingreso.",
  CODE_INVALIDO: "El ingreso expiró. Intenta de nuevo.",
  STATE_INVALIDO: "La solicitud de ingreso no es válida o expiró. Intenta de nuevo.",
};

export function AuthCallback() {
  const nav = useNavigate();
  const toast = useToast();
  const { refreshMe } = useAuth();
  const [params] = useSearchParams();
  const [msg, setMsg] = useState("Completando tu ingreso…");

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    if (!code) {
      toast.error(ERROR_MSG[error ?? ""] ?? "No se pudo completar el ingreso con Google o Apple.");
      nav(ROUTES.home, { replace: true });
      return;
    }
    api
      .post("/auth/oauth/consume", { code })
      .then(async (r) => {
        setAccessToken(String(r.data?.data?.access ?? ""));
        await refreshMe();
        nav(takeReturnTo() ?? ROUTES.home, { replace: true });
      })
      .catch(() => {
        setMsg("No se pudo completar el ingreso.");
        toast.error("No se pudo completar el ingreso con Google o Apple.");
        nav(ROUTES.home, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
      <span className="material-symbols-outlined animate-spin text-3xl text-zinc-400">sync</span>
      <p className="text-sm text-zinc-500">{msg}</p>
    </main>
  );
}
