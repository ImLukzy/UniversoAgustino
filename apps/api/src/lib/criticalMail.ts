import type { NotificationKind } from "@hub/shared";
import { prisma } from "./prisma.js";
import { mailer } from "./mailer.js";

// Spec 32: solo estos avisos viajan también por correo (RFC 0002 §6).
export const CRITICAL_MAIL: readonly NotificationKind[] = [
  "ORDER_PAID", "PAYMENT_VERIFIED", "PAYMENT_REJECTED", "PAYOUT_PENDING",
  "ORDER_CREATED", "ORDER_ACCEPTED", "ORDER_CASE_ASSIGNED", "ORDER_APPOINTMENT_SCHEDULED",
  "ORDER_APPOINTMENT_NO_SHOW", "ORDER_APPOINTMENT_REMINDER", "ORDER_IN_CUSTODY", "SANCTION_APPLIED", "SANCTION_LIFTED",
];
export const isCritical = (type: NotificationKind) => CRITICAL_MAIL.includes(type);

function absolute(link?: string): string | undefined {
  const origin = (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",")[0]?.trim();
  return link && origin ? `${origin.replace(/\/$/, "")}${link}` : undefined;
}

// Nunca lanza: un correo caído no debe afectar la operación ni el aviso in-app.
export async function sendCriticalMail(input: { userId: string; type: NotificationKind; title: string; body: string; link?: string }): Promise<void> {
  if (!isCritical(input.type)) return;
  try {
    const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } });
    if (user?.email) await mailer.sendNotice(user.email, input.title, input.body, absolute(input.link));
  } catch (e) {
    console.error("[mail] critical_mail_failed", input.type, e instanceof Error ? e.message : e);
  }
}
