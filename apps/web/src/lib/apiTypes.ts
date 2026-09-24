// Tipos de respuesta de la API (espejo de los modelos Prisma que expone el backend).
// Comunidad UNSA-only: university siempre "UNSA". career = clave de UNSA_CAREERS.
export interface HubUser {
  id: string;
  email: string;
  role: string;
  profile?: { fullName: string; university: string; career?: string | null; cycle?: string | null; faculty?: string | null; phone?: string | null; onboardedAt?: string | null } | null;
}

export type PayMethod = "YAPE" | "PLIN" | "AMBAS";

export interface HubDocument {
  id: string;
  createdAt?: string;
  title: string;
  course: string;
  university: string;
  career?: string | null;
  cycle: string;
  type: string;
  priceCents: number;
  description?: string | null;
  fileUrl?: string | null;
  // Tipo del archivo sin exponer su ruta (spec 15/16) y páginas de muestra.
  fileType?: "pdf" | "image" | null;
  previewPages?: number[];
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
  author?: { profile?: { fullName: string } | null } | null;
}

export interface HubBazarItem {
  id: string;
  createdAt?: string;
  title: string;
  kind: string;
  tx: string;
  priceCents: number;
  depositCents?: number | null;
  description?: string | null;
  photos?: string[] | null;
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
}

export interface HubOrder {
  id: string;
  buyerId: string;
  sellerId?: string | null;
  createdAt: string;
  itemType: string;
  itemId: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: string;
  payMethod?: PayMethod | null;
  payQrUrl?: string | null;
  payDetail?: string | null;
  payProof?: string | null;
  payProofUrl?: string | null;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  cancelledReason?: string | null;
  itemTitle?: string;
  itemDesc?: string | null;
  itemTx?: string | null;
  itemPriceCents?: number | null;
  feeBps?: number | null;
  fileUrl?: string | null;
  buyerCompleted?: number;
  buyer?: { id: string; email: string; profile?: { fullName: string; career?: string | null; cycle?: string | null } | null } | null;
}

export interface HubReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface HubNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}
