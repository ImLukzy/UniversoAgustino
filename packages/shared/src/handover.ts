import { z } from "zod";

export const CaseStatusSchema = z.enum(["UNASSIGNED", "ASSIGNED", "DROP_SCHEDULED", "IN_CUSTODY", "PICKUP_SCHEDULED", "DELIVERED", "RENTED_OUT", "RETURN_SCHEDULED", "RETURNED", "BACK_TO_SELLER", "CLOSED", "CANCELLED"]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export const AppointmentKindSchema = z.enum(["DROP_OFF", "PICKUP", "RETURN", "BACK_TO_SELLER"]);
export type AppointmentKind = z.infer<typeof AppointmentKindSchema>;
export const AppointmentStatusSchema = z.enum(["SCHEDULED", "DONE", "NO_SHOW", "CANCELLED"]);
export const AssignmentSchema = z.object({ assigneeId: z.string().min(1) });
export const AppointmentSchema = z.object({
  kind: AppointmentKindSchema, sedeId: z.string().min(1), startsAt: z.string().datetime(),
});
export const ReceiveSchema = z.object({
  photoUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/),
  conditionNote: z.string().trim().min(5).max(500),
});
const transitions: Record<CaseStatus, readonly CaseStatus[]> = {
  UNASSIGNED: ["ASSIGNED", "CANCELLED"], ASSIGNED: ["DROP_SCHEDULED", "CANCELLED"],
  DROP_SCHEDULED: ["ASSIGNED", "IN_CUSTODY", "CANCELLED"], IN_CUSTODY: ["PICKUP_SCHEDULED", "BACK_TO_SELLER"],
  PICKUP_SCHEDULED: ["DELIVERED", "RENTED_OUT", "BACK_TO_SELLER"], DELIVERED: ["CLOSED"],
  RENTED_OUT: ["RETURN_SCHEDULED"], RETURN_SCHEDULED: ["RETURNED"],
  RETURNED: ["BACK_TO_SELLER"], BACK_TO_SELLER: ["CLOSED"], CLOSED: [], CANCELLED: [],
};
export const canTransitionCase = (from: CaseStatus, to: CaseStatus) => transitions[from].includes(to);
export const beforeCustody = (status: CaseStatus) => ["UNASSIGNED", "ASSIGNED", "DROP_SCHEDULED"].includes(status);

export const PickupSchema = z.object({
  paymentMethod: z.enum(["OPERATION", "CASH"]), paymentRef: z.string().trim().min(3).max(160).optional(),
  paymentConfirmed: z.literal(true),
  returnAppointment: AppointmentSchema.refine((v) => v.kind === "RETURN", "Selecciona una cita de devolución").optional(),
}).superRefine((v, ctx) => {
  if (v.paymentMethod === "OPERATION" && !v.paymentRef) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentRef"], message: "Indica el n.º de operación" });
});
export type PickupInput = z.infer<typeof PickupSchema>;
export const ReturnReviewSchema = z.object({
  condition: z.enum(["OK", "DAMAGED"]), conditionNote: z.string().trim().min(5).max(500), reviewConfirmed: z.literal(true),
  photoUrl: ReceiveSchema.shape.photoUrl.optional(),
});
export const SellerPaymentReportSchema = z.object({ reason: z.string().trim().min(5).max(500) });
