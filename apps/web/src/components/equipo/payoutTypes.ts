export type PayoutRow = {
  id: string; orderId: string; amountCents: number; feeCents: number; netCents: number;
  status: "PENDING" | "COMPLETED" | "FROZEN" | "REFUNDED"; dueAt: string; createdAt: string; completedAt: string | null;
  refundRequired?: boolean; refundProofUrl?: string | null; refundPaymentRef?: string | null; refundedAt?: string | null;
  proofUrl: string | null; paymentRef: string | null; frozenReason: string | null;
  payMethod?: string | null; payDetail?: string | null; payQrUrl?: string | null;
  seller?: { email: string; profile: { fullName: string } | null };
  order: { itemType?: string; handoverCase?: { status: string } | null; itemTitle: string; feeBps?: number; buyer?: { email: string; profile: { fullName: string } | null } };
};
export type PayoutPage = { data: PayoutRow[]; nextPage: number | null };
