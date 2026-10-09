import { expect, it } from "vitest";
import { CompletePayoutSchema, EarningsPeriodSchema, PayoutListSchema, ResumePayoutSchema } from "./payouts.js";
it.each([{}, { proofUrl: "https://external.test/proof.png" }, { proofUrl: "/uploads/../proof.png" }])("rechaza comprobante ausente/externo/traversal", (body) => { expect(CompletePayoutSchema.safeParse(body).success).toBe(false); });
it("acepta foto interna sin número de operación", () => { expect(CompletePayoutSchema.parse({ proofUrl: "/uploads/proof.png" })).toEqual({ proofUrl: "/uploads/proof.png" }); });
it("cliente no altera neto", () => { expect(CompletePayoutSchema.safeParse({ proofUrl: "/uploads/proof.png", netCents: 1 }).success).toBe(false); });
it("reanudar requiere motivo y lo recorta", () => { expect(ResumePayoutSchema.safeParse({ reason: " " }).success).toBe(false); expect(ResumePayoutSchema.parse({ reason: "  Reclamo resuelto  " }).reason).toBe("Reclamo resuelto"); });
it("lista solo estados válidos y páginas positivas", () => { expect(PayoutListSchema.parse({})).toEqual({ status: "PENDING", page: 1 }); expect(PayoutListSchema.safeParse({ page: -1 }).success).toBe(false); expect(PayoutListSchema.safeParse({ status: "REFUNDED" }).success).toBe(false); });
it("periodo invertido o superior a un año falla", () => { expect(EarningsPeriodSchema.safeParse({ from: "2026-10-10T00:00:00Z", to: "2026-10-09T00:00:00Z" }).success).toBe(false); expect(EarningsPeriodSchema.safeParse({ from: "2024-01-01T00:00:00Z", to: "2026-01-01T00:00:00Z" }).success).toBe(false); });
it("periodo con zona Lima válido", () => { expect(EarningsPeriodSchema.safeParse({ from: "2026-10-01T00:00:00-05:00", to: "2026-11-01T00:00:00-05:00" }).success).toBe(true); });
