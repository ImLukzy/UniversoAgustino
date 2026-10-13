import type { ReviewStatus } from "@hub/shared";

export function ReviewChip({ status, note }: { status?: ReviewStatus; note?: string | null }) {
  if (!status || status === "APPROVED") return null;
  return <span className="chip max-w-full whitespace-normal wrap-break-word bg-primary-soft text-primary">
    {status === "PENDING" ? "En revisión" : `Rechazada: ${note || "Sin motivo registrado"}`}
  </span>;
}
