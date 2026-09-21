import { prisma } from "../lib/prisma.js";

// Sprint F1-08: notificaciones in-app. Nunca lanzan: un fallo al notificar
// no debe abortar la transacción de negocio (el llamador no necesita
// try/catch, pero la creación del pedido sí se hace antes).
interface NotifyInput {
  userId: string;
  type:
    | "ORDER_CREATED"
    | "ORDER_ACCEPTED"
    | "ORDER_PAID"
    | "ORDER_RELEASED"
    | "ORDER_EXPIRED"
    | "ORDER_CANCELLED"
    | "REPORT_RESOLVED";
  title: string;
  body: string;
  link?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({ data: input });
  } catch (e) {
    console.error("[notify] notification_failed", e);
  }
}

export function orderLink(orderId: string): string {
  return `/ventas?order=${orderId}`;
}
