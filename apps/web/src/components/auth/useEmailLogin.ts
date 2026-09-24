import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { api, apiError, setAccessToken } from "../../lib/api";
import { completeUnsaEmail, onlyDigits, unsaEmailError } from "../../lib/emailLogin";
import { useAuth } from "../../auth/AuthContext";

type Step = "email" | "code";

// Spec 22: correo UNSA → código de 6 dígitos al buzón → sesión. Si la cuenta
// es nueva, OnboardingGate la lleva a /bienvenida al cargar la sesión.
export function useEmailLogin(onDone: () => void) {
  const { refreshMe } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [raw, setRaw] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const send = async (target: string) => {
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/auth/email/start", { email: target });
      setResendIn(Number(r.data?.data?.resendIn ?? 60));
      setStep("code");
    } catch (ex) {
      // Ya hay un código reciente: se usa ese y se respeta la espera.
      const body = axios.isAxiosError(ex) ? (ex.response?.data as { error?: { code?: string; retryIn?: number } } | undefined) : undefined;
      if (body?.error?.code === "ESPERA_REENVIO") {
        setResendIn(Number(body.error.retryIn ?? 60));
        setStep("code");
      } else setError(apiError(ex));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    const invalid = unsaEmailError(raw);
    if (invalid) return setError(invalid);
    const target = completeUnsaEmail(raw);
    setEmail(target);
    setCode("");
    void send(target);
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError("El código tiene 6 dígitos");
    setBusy(true);
    setError("");
    try {
      const r = await api.post("/auth/email/verify", { email, code });
      setAccessToken(String(r.data?.data?.access ?? ""));
      await refreshMe();
      onDone();
    } catch (ex) {
      setError(apiError(ex));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return {
    step,
    raw,
    email,
    code,
    error,
    busy,
    resendIn,
    setRaw: (v: string) => (setRaw(v), setError("")),
    setCode: (v: string) => (setCode(onlyDigits(v)), setError("")),
    submitEmail,
    submitCode,
    resend: () => resendIn <= 0 && !busy && void send(email),
    back: () => (setStep("email"), setError(""), setCode("")),
  };
}
