# Especificación: 35 - Sin comisión de plataforma

Decisión del humano (2026-10-08): **quitar la comisión del 13 %**. Con el modelo del RFC 0002 la plataforma no cobra nada: el comprador paga el precio publicado y el vendedor recibe el 100 %.

## 1. Objetivo
**Problema:** `PLATFORM_FEE_PCT = 13` (`packages/shared/src/orders.ts:91`) y ~35 archivos de UI, legales, FAQ y datos por carrera prometen o descuentan una comisión que nunca se cobra.
**Resultado esperado:** comisión 0 % en cálculo y en todos los textos; los pedidos nuevos guardan `feeCents = 0`, `netCents = amountCents`. Los pedidos históricos conservan su snapshot (no se reescriben).

## 2. Fuera de alcance
- Borrar columnas `feeCents/netCents/feeBps` ni `computePrice()`: se mantienen (porcentaje 0) para no romper contrato ni historia. Migraciones: ninguna.
- Rediseñar Monetiza/Suscripción más allá de quitar la comisión.

**Decisiones que requieren aprobación:** ninguna (aprobada por el humano, incluidos textos legales y de cobro).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/orders.ts:91` | modificar | `PLATFORM_FEE_PCT = 0` + tests de `computePrice` con 0 |
| `packages/shared/src/extra.ts:9` | revisar | default sigue a la constante |
| `render.yaml:66` | modificar | `PLATFORM_FEE_PCT` = "0" (god actualiza también la variable en Render) |
| `apps/web/src/components/detalle/{BuyPanel,useDetail}.ts(x)`, `checkout/OrderSummary.tsx`, `RentalCard.tsx`, `ventas/DigitalSales.tsx`, `pages/Ventas.tsx`, `lib/apiTypes.ts` | modificar | sin línea de comisión; "Recibes el 100 %" donde hoy se muestra neto |
| `apps/web/src/components/monetiza/{MonetizaHero,PublishSteps,EarningsSimulator}.tsx`, `pages/Suscripcion.tsx` | modificar | quitar 13 % del discurso y del simulador |
| `apps/web/src/components/publicar/{StepPriceLegal.tsx,usePublishForm.ts}` | modificar | "Recibes S/ X" = precio |
| `apps/web/src/components/legal/CreatorTerms.tsx`, `components/landing/LandingFAQ.tsx`, `data/landingFaq.ts` | modificar | términos y FAQ: sin comisión; el equipo coordina la entrega gratis |
| `apps/web/src/data/career/*.ts` (17) | modificar | `feeFisicoBody` y similares: sin "13 %" |
| `apps/api/src/modules/orders/create.ts` | revisar | usa `env.FEE_PCT`; sin cambios si lee la constante |
| `apps/api/docs/openapi.yaml`, `docs/API_SPECS.md`, `docs/PROJECT_CONTEXT.md` | modificar | ejemplos y reglas sin 13 % |

## 4. Criterios de aceptación
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1–A4 | gates | | verdes; test `computePrice(1000, 0)` → fee 0, net 1000 |
| A5 | Tamaño | ≤ 150 por archivo tocado (exentos openapi, docs) | |
| A12 | Barrido | `grep -rniE "13 ?%|comisi[oó]n" apps/web/src packages/shared/src` | 0 coincidencias salvo textos que digan explícitamente "sin comisión" |
| A11 | E2E (god) | detalle, checkout, publicar y monetiza no muestran comisión; pedido nuevo en BD dev con fee 0 | pasa |

## 5. Checklist
- [ ] Constante + tests · [ ] UI de compra/venta · [ ] Monetiza/Publicar · [ ] Legal/FAQ/carreras · [ ] Docs · [ ] Gates y §7

## 6. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
