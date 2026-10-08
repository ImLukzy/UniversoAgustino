import { describe, expect, it } from "vitest";
import { SanctionInputSchema, ReviewInputSchema, canApplySanction, isBlocking, shouldAutoSuspend } from "./sanctions.js";

describe("sanciones", () => {
  it("3 faltas activan la suspensión", () => { expect(shouldAutoSuspend(2)).toBe(false); expect(shouldAutoSuspend(3)).toBe(true); });
  it("el Trabajador solo advierte", () => {
    expect(canApplySanction("moderator", "WARNING")).toBe(true);
    expect(canApplySanction("moderator", "SUSPENSION")).toBe(false);
    expect(canApplySanction("moderator", "BAN")).toBe(false);
    expect(canApplySanction("admin", "BAN")).toBe(true);
    expect(canApplySanction("student", "WARNING")).toBe(false);
  });
  it("la suspensión exige días y los demás no los admiten", () => {
    expect(SanctionInputSchema.safeParse({ kind: "SUSPENSION", reason: "Motivo claro" }).success).toBe(false);
    expect(SanctionInputSchema.safeParse({ kind: "SUSPENSION", reason: "Motivo claro", days: 31 }).success).toBe(false);
    expect(SanctionInputSchema.safeParse({ kind: "SUSPENSION", reason: "Motivo claro", days: 7 }).success).toBe(true);
    expect(SanctionInputSchema.safeParse({ kind: "BAN", reason: "Motivo claro", days: 7 }).success).toBe(false);
    expect(SanctionInputSchema.safeParse({ kind: "WARNING", reason: "abc" }).success).toBe(false);
  });
  it("reseña 1–5 y comentario ≤500", () => {
    expect(ReviewInputSchema.safeParse({ score: 0 }).success).toBe(false);
    expect(ReviewInputSchema.safeParse({ score: 5, comment: "a".repeat(501) }).success).toBe(false);
    expect(ReviewInputSchema.parse({ score: 4 }).comment).toBe("");
  });
  it("bloquea solo suspensión/ban vigentes no levantados", () => {
    const now = new Date("2026-10-10T00:00:00Z");
    expect(isBlocking({ kind: "WARNING", liftedAt: null, endsAt: null }, now)).toBe(false);
    expect(isBlocking({ kind: "SUSPENSION", liftedAt: null, endsAt: new Date("2026-10-11T00:00:00Z") }, now)).toBe(true);
    expect(isBlocking({ kind: "SUSPENSION", liftedAt: null, endsAt: new Date("2026-10-09T00:00:00Z") }, now)).toBe(false);
    expect(isBlocking({ kind: "SUSPENSION", liftedAt: new Date(), endsAt: null }, now)).toBe(false);
    expect(isBlocking({ kind: "BAN", liftedAt: null, endsAt: null }, now)).toBe(true);
  });
});
