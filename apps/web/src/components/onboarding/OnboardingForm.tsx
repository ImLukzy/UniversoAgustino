import type { ReactNode } from "react";
import { CYCLES, UNSA_FACULTIES } from "@hub/shared";
import type { HubUser } from "../../lib/api";
import { FormMessage, inputCls, primaryBtn } from "../auth/fields";
import { careersOf } from "../../lib/onboarding";
import { useOnboarding, type OnboardingField } from "./useOnboarding";

const label = "flex flex-col gap-1.5 text-sm font-bold text-zinc-800";

function Field({ id, title, error, hint, children }: { id: string; title: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className={label}>
      <label htmlFor={id}>{title}</label>
      {children}
      <FormMessage error={error} hint={hint} />
    </div>
  );
}

// Perfil obligatorio de primer ingreso (spec 21). El correo viene de la
// cuenta verificada y no se puede editar; el resto es obligatorio.
export function OnboardingForm({ user, onDone }: { user: HubUser; onDone: () => Promise<void> }) {
  const { f, set, errors, formError, saving, submit } = useOnboarding(user, onDone);
  const careers = careersOf(f.faculty);
  const bind = (k: OnboardingField) => ({
    id: `ob-${k}`,
    value: f[k],
    "aria-invalid": !!errors[k],
    onChange: (e: { target: { value: string } }) => set(k, e.target.value),
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
      <div className="sm:col-span-2">
        <Field id="ob-email" title="Correo institucional" hint="Verificado y no editable.">
          <span className="relative block">
            <input id="ob-email" className={`${inputCls} cursor-not-allowed bg-zinc-100 pr-11 text-zinc-600`} value={user.email} readOnly disabled aria-readonly="true" />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-lg text-zinc-500" aria-hidden="true">lock</span>
          </span>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="ob-fullName" title="Nombres y apellidos completos" error={errors.fullName}>
          <input {...bind("fullName")} className={inputCls} autoComplete="name" maxLength={120} placeholder="Ej. Rosa María Quispe Mamani" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="ob-faculty" title="Facultad" error={errors.faculty}>
          <select {...bind("faculty")} className={inputCls}>
            <option value="">Elige tu facultad</option>
            {UNSA_FACULTIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="ob-career" title="Carrera (Escuela Profesional)" error={errors.career}>
          <select {...bind("career")} className={inputCls} disabled={!f.faculty}>
            <option value="">{f.faculty ? "Elige tu carrera" : "Primero elige tu facultad"}</option>
            {careers.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
      </div>
      <Field id="ob-cycle" title="Ciclo actual" error={errors.cycle}>
        <select {...bind("cycle")} className={inputCls}>
          <option value="">Elige tu ciclo</option>
          {CYCLES.map((c) => <option key={c} value={c}>Ciclo {c}</option>)}
        </select>
      </Field>
      <Field id="ob-phone" title="Número de celular" error={errors.phone}>
        <span className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">+51</span>
          <input {...bind("phone")} className={`${inputCls} pl-12`} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={15} placeholder="987 654 321" />
        </span>
      </Field>
      <div className="mt-2 sm:col-span-2">
        <FormMessage error={formError} />
        <button type="submit" disabled={saving} className={primaryBtn}>
          <span className="material-symbols-outlined text-lg" aria-hidden="true">how_to_reg</span>
          {saving ? "Guardando…" : "Completar mi perfil"}
        </button>
      </div>
    </form>
  );
}
