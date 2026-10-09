import { sendPayoutReminders } from "../modules/payouts/reminders.js";
import { sendCriticalMail } from "../lib/criticalMail.js";
export async function payoutReminderTick() {
  const rows = await sendPayoutReminders();
  await Promise.all(rows.map((p) => sendCriticalMail({ userId: p.collectorId, type: "PAYOUT_DUE", title: "Liquidación por vencer",
    body: `Revisa el pago pendiente de S/ ${(p.netCents / 100).toFixed(2)}.`, link: "/equipo?tab=liquidaciones" })));
  return rows.length;
}
export function startPayoutReminders() {
  const tick = () => payoutReminderTick().catch((e) => console.error("[jobs] payout reminders failed", e));
  void tick(); setInterval(tick, 15 * 60000).unref();
}
