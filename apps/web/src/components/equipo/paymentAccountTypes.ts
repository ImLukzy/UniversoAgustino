export interface PaymentAccount {
  id: string; userId: string; method: "YAPE" | "PLIN" | "OTHER"; holder: string; number: string;
  photoUrl: string | null; qrUrl: string; active: boolean;
}
export type AccountFields = Omit<PaymentAccount, "id">;
