import { expireReservations } from "./expireReservations.js";

/**
 * Scheduler mínimo sin dependencias (setInterval). Solo corre cuando
 * ENABLE_JOBS=true: exactamente una instancia en producción.
 * La expiración perezosa en POST /orders cubre el caso de cron caído,
 * así que este job es convergencia, no corrección.
 */
export function startJobs(): void {
  if (process.env.ENABLE_JOBS !== "true") {
    console.log("[jobs] disabled (ENABLE_JOBS != true)");
    return;
  }
  const everyMs = 60_000;
  const tick = () => {
    expireReservations(new Date())
      .then((r) => {
        if (r.expired > 0) {
          console.log(`[jobs] expireReservations expired=${r.expired} mode=${r.mode}`);
        }
      })
      .catch((e) => console.error("[jobs] expireReservations failed", e));
  };
  const timer = setInterval(tick, everyMs);
  timer.unref();
  console.log("[jobs] expireReservations every 60s");
}
