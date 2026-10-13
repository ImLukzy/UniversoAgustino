# Especificación: 50 - Pruebas E2E en el repo y datos fijos de QA

## 1. Objetivo
**Problema:** las pruebas de navegador de QA se rehacen en `/tmp` en cada tarea (specs 45 y 46) y usan datos reales de la BD de desarrollo (avisos y sanciones a usuarios reales de dev, aunque luego se restauren). En `scripts/` ya hay piezas sueltas (`f0-fixtures.mjs`, `e2e-f1.mjs`, `e2e-sprint1a.mjs`, `f0-axe.mjs`) con puertos y rutas fijas.
**Resultado esperado:** (a) un script idempotente que crea/actualiza datos de QA propios (`qa-*`) en la BD de **desarrollo** y se niega a correr contra producción; (b) pruebas E2E versionadas en `tests/e2e/` que cubren los flujos de las specs 45 y 46, ejecutables con un comando contra servidores locales.

## 2. Fuera de alcance
- Ejecutar E2E en el CI de GitHub (requiere BD; queda para otra spec).
- Cambiar código de la app o de la API.
- Borrar los scripts existentes de `scripts/` (solo reutilizar lo útil).

**Decisiones de producto:** aprobadas por el humano 2026-10-12.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/qa-seed.mjs` | crear | crea/actualiza usuarios `qa-*@unsa.edu.pe` (estudiante comprador, vendedor, trabajador, técnico; contraseña de `QA_PASSWORD` o la actual de QA), una publicación aprobada de cada tipo del vendedor QA, y un pedido entregado del comprador QA. Idempotente. Aborta si `DATABASE_URL`/`DIRECT_DATABASE_URL` no contiene el host de dev o contiene el de prod (`ep-hidden-dew`). No imprime secretos. |
| `tests/e2e/*.e2e.mjs` (o `.spec` con el runner que ya trae `playwright`) | crear | spec 45 (pausar/reactivar, catálogo, 409, comprador previo) y spec 46 (reportar al vendedor, denuncias, retirar, sancionar con confirmación, restaurar), cada uno restaura lo que cambia |
| `tests/e2e/README.md` | crear | cómo levantar API y web locales contra BD dev, sembrar y correr |
| `package.json` (raíz) | modificar | scripts `qa:seed` y `e2e` |
| `AGENTS.md` | modificar | una línea: QA usa `qa:seed` + `npm run e2e` y no toca datos de otros usuarios |

## 4. Diseño y lógica
- Base URL de API y web por variables (`E2E_API_URL`, `E2E_WEB_URL`), con valores por defecto locales.
- Navegador: `playwright` (chromium o `/usr/bin/google-chrome-stable` vía `E2E_CHROME`), con axe (`axe-core` ya está en node_modules) para A10 y medición de scroll a 375 px.
- Solo datos `qa-*`; nunca tocar publicaciones o usuarios que no sean de QA.
- Salida: un renglón por caso ✓/✗ y código de salida ≠ 0 si algo falla.
- Archivos < 150 líneas (dividir por flujo).

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Seed seguro | `qa:seed` con URL de prod (simulada con una cadena que contenga `ep-hidden-dew`) aborta sin conectar | OK |
| A3 | Seed idempotente | correr `qa:seed` dos veces contra dev | sin duplicados |
| A4 | E2E | API y web locales contra dev + `npm run e2e` | todos ✓; datos restaurados |

## 6. Checklist de ejecución
- [x] Tarea 1: `qa-seed.mjs` + scripts npm.
- [x] Tarea 2: E2E de specs 45 y 46 + README + AGENTS.md.
- [x] Tarea 3: verificar A1–A4 (QA) y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-12 | A1 | OK `npm run verify` | Dwight e86bfd6 |
| 2026-10-12 | A2/A3 | OK: URL con ep-hidden-dew aborta antes de conectar; `qa:seed` dos veces sin duplicados | Dwight; comprobado también por Kelly |
| 2026-10-12 | A4 | OK: `npm run e2e` specs 45 y 46 ✓ con datos qa-* restaurados | Dwight contra servidores locales + BD dev |
| 2026-10-12 | Auditoría | OK sin hallazgos | Kelly |
