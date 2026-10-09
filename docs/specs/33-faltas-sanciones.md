# Especificación 33 - Faltas, calificaciones y sanciones

Fuente: RFC 0002 §4 (`UserReview`, `Sanction`, strikes), §5 (Usuarios), §6 (suspendido). Estado: **aprobada por god (2026-10-08T22-02-14) con ajuste D-D; implementada**. Depende de 31 (`Appointment.NO_SHOW`) y 32 (`sendCriticalMail`/`SANCTION_APPLIED`).

## 1. Objetivo
**Problema:** `markNoShow` (`cases/appointments.ts`) solo marca la cita; no hay falta contada, ni forma de calificar o comentar a un usuario, ni sanciones. Quien falta repetidamente puede seguir solicitando y publicando.
**Resultado esperado:** cada NO_SHOW suma una falta; 3 faltas en 90 días → suspensión automática de 14 días (no puede solicitar ni publicar; ve aviso con motivo y fecha fin). El equipo califica (1–5) y comenta a usuarios (visible solo al equipo) y aplica WARNING/SUSPENSION; solo el Técnico aplica BAN o levanta sanciones.

## 2. Fuera de alcance
- Mostrar calificaciones o comentarios al usuario evaluado o a otros estudiantes (solo equipo).
- Sanciones a miembros del equipo (no se sanciona a `moderator`/`admin`).
- Apelaciones, reembolsos, tocar pagos o `canTransition`. Aplicar la migración (god).
**Decisiones que requieren aprobación:** D-A: el strike se crea al marcar NO_SHOW y vale para la parte ausente (`Appointment.partyId`); no cuenta si el equipo lo anula (Técnico "perdona" la falta → `forgivenAt`). D-B: la ausencia que ya cuenta la segunda falta de un caso no cancela el trato sola (spec 31 §4.4 sigue vigente). D-C: la suspensión automática se prolonga 14 días desde la 3.ª falta; mientras haya suspensión vigente no se crea otra automática. D-D (ajustada por god): el Trabajador solo aplica WARNING y califica/comenta. SUSPENSION manual, BAN, perdonar faltas y levantar sanciones: solo el Técnico. Toda sanción con motivo obligatorio y AuditLog. BAN bloquea solicitar y publicar de forma indefinida pero no impide entrar, ver y llegar al aviso. D-E: una suspensión/BAN no cancela casos ya en curso: el trato sigue y el equipo decide.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `Strike`, `UserReview`, `Sanction`, enum `SanctionKind`; tipos de aviso `SANCTION_APPLIED`, `SANCTION_LIFTED` |
| `apps/api/prisma/migrations/20261009093000_faltas_sanciones/migration.sql` | crear | aditiva, no aplicada |
| `packages/shared/src/sanctions.ts`, `sanctions.test.ts`, `index.ts` | crear/modificar | esquemas y `countsTowardSuspension` |
| `packages/shared/src/notifications.ts`, `.test.ts` | modificar | `SANCTION_APPLIED/LIFTED` → `orders` |
| `apps/api/src/modules/sanctions/strikes.ts` | crear | registra falta dentro de la transacción de NO_SHOW y aplica suspensión automática |
| `apps/api/src/modules/sanctions/guard.ts` | crear | `assertNotSuspended(userId)` → 403 `ACCOUNT_SUSPENDED` con `reason`, `endsAt` |
| `apps/api/src/modules/sanctions/users.ts` | crear | `/staff/users` buscar, ficha, reseñas, sanciones, levantar, perdonar |
| `apps/api/src/modules/sanctions/strikes.test.ts`, `guard.test.ts`, `users.test.ts` | crear | faltas, bloqueo, permisos |
| `apps/api/src/modules/orders/requests.test.ts`, `staff/reviews.test.ts` | modificar | mock de `sanction` + casos de suspendido |
| `scripts/docs-check.mjs` | modificar | registrar `sanctions/users.ts` |
| `apps/api/src/modules/cases/appointments.ts` | modificar | llamar `recordStrike` dentro de la transacción de `markNoShow` |
| `apps/api/src/modules/orders/create.ts`, `bazar/routes.ts`, `documents/listing.ts` | modificar | `assertNotSuspended` al solicitar / publicar |
| `apps/api/src/modules/auth/routes.ts` | modificar | `GET /auth/me` expone `suspension {kind, reason, endsAt, message}` |
| `apps/api/src/modules/staff/routes.ts` | modificar | montar `/users` |
| `apps/api/docs/openapi.yaml` | modificar | rutas nuevas |
| `apps/web/src/components/equipo/UsuariosTab.tsx`, `UserCard.tsx`, `ReviewForm.tsx`, `SanctionForm.tsx` | crear | pestaña Usuarios |
| `apps/web/src/pages/Equipo.tsx` | modificar | pestaña Usuarios |
| `apps/web/src/components/SuspensionBanner.tsx`, `AppLayout.tsx`, `lib/apiTypes.ts` | crear/modificar | aviso claro con motivo y fecha fin en toda la app; el servidor responde 403 `ACCOUNT_SUSPENDED` con el mismo texto si se intenta solicitar/publicar (los botones no se deshabilitan) |

## 4. Diseño y lógica
- **Datos:** `Strike { id, userId, appointmentId @unique, createdAt, forgivenAt?, forgivenById? }`; `UserReview { id, subjectId, authorId, caseId?, score 1–5, comment 0–500, createdAt }` (única por autor+caso+sujeto); `Sanction { id, userId, kind WARNING|SUSPENSION|BAN, reason 5–300, startsAt, endsAt?, byId?, auto bool, liftedAt?, liftedById? }`, índice `(userId, liftedAt, endsAt)`.
- **Falta:** `markNoShow` ya corre bajo el lock 300030; dentro de la misma transacción `recordStrike(partyId, appointmentId)` crea `Strike` (único por cita → idempotente) y cuenta faltas no perdonadas con `createdAt ≥ ahora−90 d`. Si ≥3 y no hay `Sanction` activa de tipo SUSPENSION/BAN → crea SUSPENSION `auto=true`, `endsAt = ahora+14 d`, motivo "3 faltas en 90 días". Aviso `SANCTION_APPLIED` + correo (spec 32) después del commit. Auditoría `strike.create`, `sanction.auto`.
- **Activa:** `liftedAt` nulo y (`endsAt` nulo o futuro). Suspensión/BAN bloquean `POST /orders`, `POST /bazar`, `POST /documents` (código `ACCOUNT_SUSPENDED`, 403, `message` con motivo y fecha fin; el ban sin fecha). Lectura y navegación siguen. `/auth/me` devuelve la sanción activa para el banner.
- **Equipo:** Trabajador y Técnico: buscar usuario (`GET /staff/users?q=`), ver historial (tratos, faltas, reseñas, sanciones), crear `UserReview`, aplicar WARNING. **Solo Técnico:** SUSPENSION manual (1–30 días), BAN, levantar sanciones (`POST /staff/users/:id/sanctions/:sid/lift`, motivo obligatorio) y perdonar faltas (motivo obligatorio). El rol se relee de la BD en cada acción (no del token). No se sanciona a staff (409 `TARGET_IS_STAFF`). Toda acción con motivo y AuditLog; transacciones bajo el lock 300030 cuando afectan citas (no necesario aquí; basta transacción simple).
- **API:** `GET /api/v1/staff/users`, `GET /api/v1/staff/users/:id`, `POST /api/v1/staff/users/:id/reviews`, `POST /api/v1/staff/users/:id/sanctions`, `POST /api/v1/staff/users/:id/sanctions/:sid/lift`, `POST /api/v1/staff/users/:id/strikes/:strikeId/forgive`. Reseñas y comentarios nunca salen por rutas de usuario.
- **UI:** banner con motivo y fecha fin; botones "Solicitar/Publicar" deshabilitados con `aria-describedby`; tokens `primary*`, error `#b91c1c`; componentes <150 líneas.
- **Invariantes:** sin dinero; `canTransition` intacto.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 |
| A2 | Lint + any | lint con `--ignore-pattern 'hive/**'` y `any-budget --check` | 0 / 0 |
| A3 | Tests | `npm test` | verde; ≥20 nuevos (49 reales): 1.ª/2.ª falta sin sanción, 3.ª → SUSPENSION 14 d, faltas >90 d no cuentan, perdonada no cuenta, no duplica suspensión, idempotencia por cita, bloqueo solicitar/publicar con código y fecha, BAN solo admin, Trabajador no levanta, staff no sancionable, reseñas ocultas al usuario |
| A4 | Contrato | `npm run docs:check` | 6 rutas |
| A5 | Tamaño | `wc -l` | ≤150 |
| A7 | Móvil | Equipo y banner a 375 px | 0 px |
| A10 | a11y | axe en Usuarios | 0 serias |
| A11 | E2E dev | 3 NO_SHOW de un estudiante → suspendido, ve fecha fin, `POST /orders` 403; Técnico levanta → vuelve a solicitar | pasa |

## 6. Checklist
- [x] Modelo, migración y shared
- [x] Faltas + suspensión automática
- [x] Guard en solicitar/publicar + `/auth/me`
- [x] Rutas de equipo (reseñas, sanciones, perdón)
- [x] UI Usuarios + banner
- [x] Gates A1–A5 y verificación integrada de god; evidencia en §7

- [x] E2E de god y auditoría Kelly APTO

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1 | ✅ | tsc api+web con alias al shared y a un cliente Prisma generado aparte desde el schema del worktree (node_modules compartido, solo lectura) |
| 2026-10-08 | A2 | ✅ | lint `--ignore-pattern 'worktrees/**' 'hive/**'` 0/0; `any-budget --check` 0 <= 0 |
| 2026-10-08 | A3 | ✅ | API 355 verdes (+31 de sanctions: strikes 10, guard 4, users 17; +3 en requests/reviews), shared 79 verdes (+5 sanctions) |
| 2026-10-08 | A4 | ✅ | `docs:check` 92 rutas (+6 `/staff/users…`) |
| 2026-10-08 | A5 | ✅ | users.ts 94, strikes.ts 31, guard.ts 16, UserCard 47, SanctionForm 24 líneas |
| 2026-10-08 | A1–A4, suite integrada | ✅ | god en main `84c0f8e`: typecheck 0 errores; API 366, web 80, shared 83 tests verdes; lint 0; docs:check 94 rutas; any-budget 0. Sustituye las salvedades de shared/Prisma del worktree en el registro inicial. |
| 2026-10-08 | A7, A10, A11; auditoría | ✅ | god confirma: 3 ausencias → una suspensión de 14 días; `/bazar` y `/orders` bloquean con 403 `ACCOUNT_SUSPENDED`; banner con fecha fin; Trabajador WARNING 201 y suspensión/levantar/perdonar 403; staff 409; Técnico levanta y restablece acceso; usuario no ve reseñas. Cierre de dev y Kelly APTO confirmados por god. |
