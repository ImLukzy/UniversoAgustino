# Especificación: 52 - E2E en el CI de GitHub

## 1. Objetivo
**Problema:** `npm run e2e` (spec 50) solo corre a mano contra la BD de desarrollo. El CI ya levanta Postgres para los tests de la API (`.github/workflows/ci.yml`, job `test`), pero no ejecuta los flujos de navegador.
**Resultado esperado:** un job `e2e` en el CI que migra una BD efímera, siembra los datos QA, levanta API y web compiladas y ejecuta `npm run e2e` en cada push a main y en cada PR; el `gate` lo exige.

## 2. Fuera de alcance
- Cambiar código de la app o de la API.
- Los casos de prueba (los escribe la spec 51); este trabajo solo los hace correr en CI.
- Secretos reales: el CI usa solo valores ficticios.

**Decisiones de producto:** aprobadas por el humano 2026-10-12.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/qa-seed.mjs` | modificar | SOLO el bloque de protección del inicio: además de la BD dev, permitir una BD local (`localhost`/`127.0.0.1`) únicamente si `CI=true` o `QA_SEED_ALLOW_LOCAL=1`; sigue abortando siempre ante `ep-hidden-dew` |
| `scripts/e2e-ci.mjs` (o similar) | crear | migra (`prisma migrate deploy`), siembra, compila API y web, arranca ambos en segundo plano, espera a que respondan, ejecuta `npm run e2e`, y apaga los procesos; código de salida del e2e |
| `.github/workflows/ci.yml` | modificar | job `e2e` (ubuntu-24.04, Node 24, servicio postgres como el de `test`, Chrome/Chromium disponible) y añadirlo a `needs` del `gate` |
| `tests/e2e/README.md` | modificar | cómo corre en CI y cómo reproducirlo en local con una Postgres local |
| `package.json` | modificar | script `e2e:ci` |

## 4. Diseño y lógica
- Variables ficticias: `JWT_*` de CI, `MAIL_DRIVER=console`, `STORAGE_DRIVER=local`, `ENABLE_JOBS=false`, `WEB_ORIGIN` igual a la URL de la web local.
- Chrome: usar el instalado en el runner o `npx playwright install --with-deps chromium`; `E2E_CHROME` configurable.
- Artefactos en fallo: capturas o logs del API subidos con `actions/upload-artifact` (versión vigente compatible con Node 24).
- Tiempo razonable: objetivo < 10 min.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Seed seguro | `ep-hidden-dew` sigue abortando; `localhost` sin `CI`/`QA_SEED_ALLOW_LOCAL` aborta | OK |
| A3 | Reproducible en local | Postgres local + `CI=true npm run e2e:ci` | ✓ |
| A4 | CI | push de la rama de integración → job `e2e` en verde y `gate` lo exige | verde |

## 6. Checklist de ejecución
- [ ] Tarea 1: guard del seed + `e2e-ci.mjs` + script npm + README.
- [ ] Tarea 2: job `e2e` en `ci.yml`.
- [ ] Tarea 3: verificar A1–A4 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
