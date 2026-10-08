import { h, row, order } from "./caseFixture.js";
export function physicalFlow(rental = false) {
  const storedOrder = { ...order, rentalEnd: rental ? new Date("2026-10-11T12:00:00Z") : null };
  const appointments = [{ id: "pickup", caseId: "case", kind: "PICKUP", status: "SCHEDULED", startsAt: new Date("2026-10-08T11:55:00Z"), endsAt: new Date("2026-10-08T12:10:00Z"), rescheduledFromId: null as string | null }];
  const stored = { ...row, status: "PICKUP_SCHEDULED", order: storedOrder, appointments, paymentRef: null, paymentMethod: null,
    receivedPhotoUrl: "/uploads/original.png", conditionNote: "Estado inicial", receivedAt: new Date("2026-10-08T10:00:00Z"),
    returnedAt: null, returnWindowStart: null, returnDeadlineAt: null, backToSellerRequestedAt: null, sellerConfirmedAt: null };
  h.handoverCase.findUnique.mockImplementation(async () => stored);
  h.handoverCase.findUniqueOrThrow.mockImplementation(async () => stored);
  h.handoverCase.update.mockImplementation(async ({ data }) => { Object.assign(stored, data); return stored; });
  h.order.update.mockImplementation(async ({ data }) => { Object.assign(storedOrder, data); return storedOrder; });
  h.appointment.create.mockImplementation(async ({ data }) => { const appointment = { id: `${data.kind}-${appointments.length}`, status: "SCHEDULED", ...data }; appointments.push(appointment); return appointment; });
  h.appointment.update.mockImplementation(async ({ where, data }) => { const appointment = appointments.find((a) => a.id === where.id)!; Object.assign(appointment, data); return appointment; });
  h.appointment.findUnique.mockImplementation(async ({ where }) => appointments.find((a) => a.id === where.id));
  h.bazarItem.update.mockResolvedValue({ id: "item" });
  return stored;
}
