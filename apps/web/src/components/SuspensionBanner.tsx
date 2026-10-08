import { useAuth } from "../auth/AuthContext";

// Spec 33: aviso claro con motivo y fecha fin; la persona puede ver pero no solicitar ni publicar.
export function SuspensionBanner() {
  const { user } = useAuth();
  const s = user?.suspension;
  if (!s) return null;
  return <div role="alert" className="mb-4 min-w-0 break-words rounded-xl border border-[#b91c1c] bg-white p-4 text-sm">
    <p className="font-bold text-[#b91c1c]">{s.kind === "BAN" ? "Tu cuenta está bloqueada" : "Tu cuenta está suspendida"}</p>
    <p>{s.message}</p>
    <p>Mientras dure puedes explorar, pero no solicitar compras ni alquileres ni publicar.</p>
  </div>;
}
