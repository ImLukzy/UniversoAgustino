import { sendDueReminders } from "../modules/cases/reminders.js";

// Render gratis duerme: no hay garantía de ejecución. Cada pasada (y la del arranque)
// envía también los atrasados cuya cita aún no empezó; reminderSentAt evita duplicados.
export function startReminderJob(everyMs = 15 * 60_000): void {
  const tick = () => sendDueReminders().then((n) => { if (n) console.log(`[jobs] reminders sent=${n}`); })
    .catch((e) => console.error("[jobs] reminders failed", e));
  void tick();
  setInterval(tick, everyMs).unref();
}
