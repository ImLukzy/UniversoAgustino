import { z } from "zod";

export const NotificationCategorySchema = z.enum(["orders", "publications", "team"]);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;
export const NOTIFICATION_CATEGORY = {
  ORDER_CREATED: "orders", ORDER_ACCEPTED: "orders", ORDER_PAID: "orders",
  ORDER_RELEASED: "orders", ORDER_EXPIRED: "orders", ORDER_CANCELLED: "orders",
  REPORT_RESOLVED: "publications", REVIEW_APPROVED: "publications", REVIEW_REJECTED: "publications",
  ORDER_CASE_ASSIGNED: "orders",
  ORDER_APPOINTMENT_SCHEDULED: "orders",
  ORDER_APPOINTMENT_NO_SHOW: "orders",
  ORDER_IN_CUSTODY: "orders",
  ORDER_PICKUP_COMPLETED: "orders",
  ORDER_RETURN_COMPLETED: "orders",
  STAFF_ADDED: "team", STAFF_REMOVED: "team",
} as const satisfies Record<string, NotificationCategory>;
export type NotificationKind = keyof typeof NOTIFICATION_CATEGORY;
export const notificationTypes = (category: NotificationCategory): NotificationKind[] =>
  (Object.keys(NOTIFICATION_CATEGORY) as NotificationKind[]).filter((type) => NOTIFICATION_CATEGORY[type] === category);
