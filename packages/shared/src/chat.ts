import { z } from "zod";

export const CHAT_MAX = 1000;
export const CASE_CLOSED_STATUSES = ["CLOSED", "CANCELLED"] as const;
export const CaseMessageSchema = z.object({ body: z.string().trim().min(1).max(CHAT_MAX) });
export const isCaseOpen = (status: string) => !(CASE_CLOSED_STATUSES as readonly string[]).includes(status);
