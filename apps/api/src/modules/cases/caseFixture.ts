import { vi } from "vitest";
const h = vi.hoisted(() => {
  const model = () => ({ findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() });
  return { payout: model(), paymentAccount: model(), user: model(), handoverCase: model(), appointment: model(), order: model(), bazarItem: model(), auditLog: model(),
    report: model(), openingHours: model(), holiday: model(), sede: model(), staffShift: model(), upload: model(), lock: vi.fn(), notify: vi.fn(), hasObject: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (tx: typeof h & { $queryRaw: typeof h.lock }) => Promise<unknown>) => fn({ ...h, $queryRaw: h.lock }) } }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify, buyerOrderLink: (id: string) => `/checkout/${id}`, orderLink: (id: string) => `/ventas?order=${id}` }));
vi.mock("../../lib/storage.js", () => ({ hasObject: h.hasObject }));
export const actor = { sub: "worker", role: "moderator" };
export const order = { id: "order", sellerId: "seller", buyerId: "buyer", itemType: "bazar", itemId: "item", status: "ACCEPTED",
  acceptedAt: new Date("2026-10-08T12:00:00Z"), itemTitle: "Libro", amountCents: 1500, feeCents: 195, netCents: 1305, verifiedAt: null as Date | null, physicalClosedAt: null as Date | null, sellerPayMethod: "PLIN", sellerPayDetail: "SELLER-TEST", sellerPayQrUrl: null, expiresAt: null };
export const row = { id: "case", orderId: "order", assigneeId: "worker", status: "ASSIGNED", receivedAt: null, sedeId: "sede",
  assignee: { profile: { fullName: "Trabajador" } }, appointments: [], order, receivedPhotoUrl: null };
export function resetCases() {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-08T12:00:00Z"));
  h.paymentAccount.findUnique.mockResolvedValue({ id: "account", userId: "worker", active: true, method: "PLIN", holder: "Titular", number: "TEAM-TEST", photoUrl: "/uploads/team.png", qrUrl: "/uploads/qr.png", user: { role: "moderator" } });
  h.payout.create.mockResolvedValue({ id: "payout" });
  h.user.findUnique.mockResolvedValue({ role: "moderator" }); h.handoverCase.findUnique.mockResolvedValue(row);
  h.handoverCase.update.mockImplementation(async ({ data }) => ({ ...row, ...data }));
  h.appointment.count.mockResolvedValue(0); h.appointment.findMany.mockResolvedValue([]);
  h.appointment.create.mockImplementation(async ({ data }) => ({ id: "appointment", ...data }));
  h.appointment.update.mockImplementation(async ({ data }) => ({ id: "appointment", partyId: "seller", kind: "DROP_OFF", ...data }));
  h.openingHours.findMany.mockResolvedValue([1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opens: 480, closes: 1080 })));
  h.holiday.findMany.mockResolvedValue([]); h.sede.findUnique.mockResolvedValue({ id: "sede", name: "Campus", active: true, address: "Calle 1", meetingPoint: "Puerta" });
  h.staffShift.findMany.mockResolvedValue([1, 2, 3, 4, 5, 6].map((weekday) => ({ id: "shift", userId: "worker", sedeId: "sede", weekday, startsMin: 480, endsMin: 1080 })));
  h.staffShift.findFirst.mockResolvedValue({ id: "shift" }); h.order.findUniqueOrThrow.mockResolvedValue(order);
  h.order.findUnique.mockResolvedValue(order);
  h.order.updateMany.mockResolvedValue({ count: 1 }); h.order.update.mockResolvedValue(order);
  h.upload.findUnique.mockResolvedValue({ ownerId: "worker", detectedMime: "image/png" }); h.hasObject.mockResolvedValue(true);
}

export { h };
