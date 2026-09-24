import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

// Campos y botón del sistema de diseño (styles/ui.css): .input / .btn.
export const inputCls = "input h-12";

export const primaryBtn = "btn btn-primary btn-lg w-full";

// Línea reservada para errores/ayuda: altura fija, no mueve el layout.
export function FormMessage({ error, hint }: { error?: string; hint?: ReactNode }) {
  return (
    <p role={error ? "alert" : undefined} className={`min-h-[1.25rem] text-xs ${error ? "font-semibold text-red-600" : "text-zinc-500"}`}>
      {error || hint}
    </p>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input ref={ref} {...props} type={show ? "text" : "password"} className={`${inputCls} pr-12`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-500 hover:text-zinc-800"
      >
        <span className="material-symbols-outlined text-lg">{show ? "visibility_off" : "visibility"}</span>
      </button>
    </span>
  );
});
