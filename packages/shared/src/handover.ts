import { z } from "zod";

export const CaseStatusSchema = z.enum(["UNASSIGNED", "ASSIGNED", "DROP_SCHEDULED", "IN_CUSTODY", "PICKUP_SCHEDULED", "DELIVERED", "RENTED_OUT", "RETURN_SCHEDULED", "RETURNED", "BACK_TO_SELLER", "CLOSED", "CANCELLED"]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export const AppointmentKindSchema = z.enum(["DROP_OFF", "PICKUP", "RETURN", "BACK_TO_SELLER"]);
export const AppointmentStatusSchema = z.enum(["SCHEDULED", "DONE", "NO_SHOW", "CANCELLED"]);
export const AssignmentSchema = z.object({ assigneeId: z.string().min(1) });
export const AppointmentSchema = z.object({
  kind: z.enum(["DROP_OFF", "PICKUP"]), sedeId: z.string().min(1), startsAt: z.string().datetime(),
});
export const ReceiveSchema = z.object({
  photoUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/),
  conditionNote: z.string().trim().min(5).max(500),
});
const transitions: Record<CaseStatus, readonly CaseStatus[]> = {
  UNASSIGNED: ["ASSIGNED", "CANCELLED"], ASSIGNED: ["DROP_SCHEDULED", "CANCELLED"],
  DROP_SCHEDULED: ["ASSIGNED", "IN_CUSTODY", "CANCELLED"], IN_CUSTODY: ["PICKUP_SCHEDULED"],
  PICKUP_SCHEDULED: ["DELIVERED", "RENTED_OUT"], DELIVERED: ["CLOSED"],
  RENTED_OUT: ["RETURN_SCHEDULED"], RETURN_SCHEDULED: ["RETURNED"],
  RETURNED: ["BACK_TO_SELLER"], BACK_TO_SELLER: ["CLOSED"], CLOSED: [], CANCELLED: [],
};
export const canTransitionCase = (from: CaseStatus, to: CaseStatus) => transitions[from].includes(to);
export const beforeCustody = (status: CaseStatus) => ["UNASSIGNED", "ASSIGNED", "DROP_SCHEDULED"].includes(status);
