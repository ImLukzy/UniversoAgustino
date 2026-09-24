import { prisma } from "../../lib/prisma.js";

// Pedidos que dan acceso completo al archivo (spec 16): solo con el abono
// verificado (vendedor o webhook de la pasarela). PAID es una declaración del
// comprador y por sí sola no desbloquea nada.
export const ACCESS_STATUSES = ["ESCROW", "RELEASED"] as const;

export interface DocRef {
  id: string;
  authorId: string;
  priceCents: number;
}

export interface Viewer {
  sub: string;
  role: string;
}

// Acceso completo (spec 15 T7, spec 16): gratis, autor, admin o pago verificado.
export async function hasFullAccess(doc: DocRef, user?: Viewer): Promise<boolean> {
  if (doc.priceCents === 0) return true;
  if (!user) return false;
  if (doc.authorId === user.sub || user.role === "admin") return true;
  const paid = await prisma.order.count({
    where: { buyerId: user.sub, itemType: "document", itemId: doc.id, status: { in: [...ACCESS_STATUSES] } },
  });
  return paid > 0;
}

// Documento de pago cuyo archivo es `/uploads/<storedName>` (o null). endsWith:
// hay filas guardadas con la URL absoluta (`http://host/uploads/<storedName>`).
export function paidDocumentFor(storedName: string): Promise<DocRef | null> {
  return prisma.document.findFirst({
    where: { fileUrl: { endsWith: `/uploads/${storedName}` }, priceCents: { gt: 0 } },
    select: { id: true, authorId: true, priceCents: true },
  });
}

// Tipo de archivo sin exponer la ruta: el Visor decide cómo pintar la vista previa.
export function fileKind(fileUrl: string | null): "pdf" | "image" | null {
  if (!fileUrl) return null;
  if (/\.pdf$/i.test(fileUrl)) return "pdf";
  if (/\.(png|jpe?g)$/i.test(fileUrl)) return "image";
  return null;
}

export function storedNameOf(fileUrl: string | null): string | null {
  const m = /^(?:https?:\/\/[^/?#]+)?\/uploads\/([A-Za-z0-9._-]+)$/.exec(fileUrl ?? "");
  return m ? m[1] : null;
}
