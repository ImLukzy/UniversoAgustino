import { describe, expect, it } from "vitest";
import { NOTIFICATION_CATEGORY, NotificationCategorySchema, notificationTypes } from "./notifications.js";
describe("mapa de categorías", () => {
  it("particiona todos los tipos sin duplicados", () => {
    const types = ["orders", "publications", "team"].flatMap((c) => notificationTypes(NotificationCategorySchema.parse(c)));
    expect(types.sort()).toEqual(Object.keys(NOTIFICATION_CATEGORY).sort());
    expect(new Set(types).size).toBe(types.length);
  });
  it("separa publicaciones, equipo y pedidos", () => {
    expect(notificationTypes("team")).toEqual(["STAFF_ADDED", "STAFF_REMOVED"]);
    expect(notificationTypes("publications")).toContain("REVIEW_REJECTED");
    expect(notificationTypes("orders").every((t) => (t.startsWith("ORDER_") || t.startsWith("PAYMENT_") || t.startsWith("PAYOUT_")) || /^(CASE_|SANCTION_)/.test(t))).toBe(true);
  });
});

it.each(["PAYMENT_VERIFIED", "PAYMENT_REJECTED", "PAYOUT_PENDING", "PAYOUT_COMPLETED", "PAYOUT_DUE", "PAYOUT_FROZEN", "PAYOUT_RESUMED"] as const)("%s se agrupa como pedido", (type) => {
  expect(notificationTypes("orders")).toContain(type);
});
