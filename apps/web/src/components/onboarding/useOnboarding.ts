import { useState, type FormEvent } from "react";
import { OnboardingSchema } from "@hub/shared";
import { api, apiError, type HubUser } from "../../lib/api";
import { careersOf } from "../../lib/onboarding";

export type OnboardingField = "fullName" | "faculty" | "career" | "cycle" | "phone";
type Form = Record<OnboardingField, string>;

// Estado, validación (mismo OnboardingSchema que el backend) y envío del
// perfil obligatorio. El nombre llega precargado desde Google/Apple.
export function useOnboarding(user: HubUser, onDone: () => Promise<void>) {
  const [f, setF] = useState<Form>({ fullName: user.profile?.fullName ?? "", faculty: "", career: "", cycle: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: OnboardingField, v: string) => {
    setF((s) => ({ ...s, [k]: v, ...(k === "faculty" ? { career: careersOf(v).length === 1 ? careersOf(v)[0]!.key : "" } : {}) }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = OnboardingSchema.safeParse(f);
    if (!parsed.success) {
      const next: Partial<Form> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as OnboardingField;
        next[k] ??= k === "career" && !f.career ? "Elige tu carrera" : k === "cycle" ? "Elige tu ciclo" : issue.message;
      }
      setErrors(next);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/auth/onboarding", parsed.data);
      await onDone();
    } catch (ex) {
      setFormError(apiError(ex));
    } finally {
      setSaving(false);
    }
  };

  return { f, set, errors, formError, saving, submit };
}
