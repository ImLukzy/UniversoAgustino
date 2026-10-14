import type { ReviewStatus } from "@hub/shared";

export function OwnerListingNotice({ review, paused, removed }: {
  review: { reviewStatus?: ReviewStatus; reviewNote?: string | null } | null;
  paused: boolean;
  removed: boolean;
}) {
  if (removed) return <p role="status" className="chip w-fit">Retirada por moderación</p>;
  const notice = review?.reviewStatus === "PENDING"
    ? "En revisión: solo tú la ves. Aparecerá en el catálogo cuando el equipo la apruebe."
    : review?.reviewStatus === "REJECTED"
      ? `Rechazada: ${review.reviewNote || "sin motivo registrado"}. Edítala desde Mis publicaciones para enviarla de nuevo.`
      : paused ? "Pausada: los compradores no la ven. Reactívala desde Mis publicaciones." : null;
  if (notice) return <p role="status" className="chip h-auto min-h-9 w-fit max-w-full whitespace-normal wrap-break-word py-1.5 leading-5">{notice}</p>;
  return null;
}
