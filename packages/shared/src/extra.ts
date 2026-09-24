import { z } from "zod";
import { PLATFORM_FEE_PCT } from "./orders.js";

// --- Monetizacion: calculadora pura (testeable) ---
export const SimulateSchema = z.object({
  avgPrice: z.number().min(0).max(500), // soles
  salesPerMonth: z.number().int().min(0).max(10000),
  bazarExtra: z.number().min(0).max(10000).default(0),
  feePct: z.number().min(0).max(50).default(PLATFORM_FEE_PCT),
});
export type SimulateInput = z.infer<typeof SimulateSchema>;

export function simulateEarnings(input: SimulateInput) {
  const gross = input.avgPrice * input.salesPerMonth + input.bazarExtra;
  const fee = +(gross * (input.feePct / 100)).toFixed(2);
  const net = +(gross - fee).toFixed(2);
  return { gross: +gross.toFixed(2), fee, net, currency: "PEN" as const };
}

// Estados de reporte observados en el modelo Report (status String con
// default OPEN; la moderación escribe ACTIONED/DISMISSED).
export const REPORT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  ACTIONED: "Atendido",
  DISMISSED: "Descartado",
};

// --- Moderacion / legal ---
export const CreateReportSchema = z.object({
  targetType: z.enum(["document", "bazar", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(2000),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
