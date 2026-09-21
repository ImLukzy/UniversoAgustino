import { describe, expect, it } from "vitest";
import { computePrice } from "./index.js";

describe("computePrice (invariante net + fee = amount)", () => {
  const cases: Array<[number, number]> = [
    [1500, 13],
    [1300, 13],
    [2000, 13],
    [0, 13],
    [1, 13], // redondeo: fee 0.13 → 0
    [199, 13], // fee 25.87 → 26
    [999, 12.5], // tasa con decimales
    [100000, 13],
  ];

  for (const [price, feePct] of cases) {
    it(`precio ${price} @ ${feePct}% cuadra al céntimo`, () => {
      const p = computePrice(price, feePct);
      expect(p.netCents + p.feeCents).toBe(p.amountCents);
      expect(p.amountCents).toBe(Math.max(0, Math.round(price)));
      expect(p.feeBps).toBe(Math.round(feePct * 100));
    });
  }

  it("caso E2E conocido: 1300 @ 13% → fee 169, neto 1131", () => {
    expect(computePrice(1300, 13)).toEqual({
      amountCents: 1300,
      feeCents: 169,
      netCents: 1131,
      feeBps: 1300,
    });
  });

  it("negativos se fijan a 0", () => {
    expect(computePrice(-50, 13).amountCents).toBe(0);
  });
});
