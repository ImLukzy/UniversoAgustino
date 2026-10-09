// RFC 0003: only staff verification of a photo unlocks purchases.
// Retain the provider implementation; its routes are disabled during mediation.
export const TEAM_MEDIATION = true;
export const teamPaymentError = { error: { code: "TEAM_PAYMENT_REQUIRED", message: "Paga a una cuenta del equipo y sube tu comprobante; el equipo verifica el abono" } };
