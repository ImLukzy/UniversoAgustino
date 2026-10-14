import type { ReviewStatus } from "@hub/shared";

export function ReviewChip({ status, note }: { status?: ReviewStatus; note?: string | null }) {
  if (!status || status === "APPROVED") return null;
  return <span className="inline-flex flex-col items-start gap-1">
    <span className="chip max-w-full whitespace-normal wrap-break-word bg-primary-soft text-primary">
      {status === "PENDING" ? "En revisión" : `Rechazada: ${note || "Sin motivo registrado"}`}
    </span>
    {status === "PENDING" && <span className="text-xs text-zinc-600">Solo tú la ves hasta que el equipo la apruebe.</span>}
  </span>;
}
