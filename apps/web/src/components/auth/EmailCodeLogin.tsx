import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import { FormMessage, inputCls, primaryBtn } from "./fields";
import { useEmailLogin } from "./useEmailLogin";

const row = "flex h-5 items-center justify-between gap-2 text-sm font-bold text-zinc-800";
const link = "text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:text-zinc-400 disabled:no-underline";

// Spec 22: ingreso con correo institucional. Ambos pasos tienen la misma
// estructura (fila, campo, mensaje, botón, nota) para no mover el modal.
export function EmailCodeLogin({ onDone }: { onDone: () => void }) {
  const s = useEmailLogin(onDone);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {s.step === "email" ? (
        <motion.form key="email" onSubmit={s.submitEmail} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING} className="flex flex-col gap-1.5">
          <label htmlFor="auth-email" className={row}>
            Correo institucional
          </label>
          <span className="relative block">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-zinc-400" aria-hidden="true">mail</span>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={160}
              placeholder="tucorreo@unsa.edu.pe"
              value={s.raw}
              onChange={(e) => s.setRaw(e.target.value)}
              aria-invalid={!!s.error}
              className={`${inputCls} pl-10`}
            />
          </span>
          <FormMessage error={s.error} />
          <button type="submit" disabled={s.busy} className={primaryBtn}>
            {s.busy ? "Enviando código…" : "Continuar con correo"}
          </button>
          <p className="h-5 text-center text-xs text-zinc-500">Te enviaremos un código de 6 dígitos.</p>
        </motion.form>
      ) : (
        <motion.form key="code" onSubmit={s.submitCode} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING} className="flex flex-col gap-1.5">
          <div className={row}>
            <label htmlFor="auth-code" className="truncate">
              Código enviado a <span className="font-semibold text-zinc-600">{s.email}</span>
            </label>
            <button type="button" onClick={s.back} className={link}>
              Cambiar
            </button>
          </div>
          <input
            id="auth-code"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={s.code}
            onChange={(e) => s.setCode(e.target.value)}
            aria-invalid={!!s.error}
            className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`}
          />
          <FormMessage error={s.error} />
          <button type="submit" disabled={s.busy} className={primaryBtn}>
            {s.busy ? "Verificando…" : "Verificar e ingresar"}
          </button>
          <p className="flex h-5 items-center justify-center text-xs text-zinc-500">
            <button type="button" onClick={s.resend} disabled={s.resendIn > 0 || s.busy} className={link}>
              {s.resendIn > 0 ? `Reenviar código en ${s.resendIn} s` : "Reenviar código"}
            </button>
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
