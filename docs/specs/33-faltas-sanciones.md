# Especificación 33 - Faltas, calificaciones y sanciones

Fuente: RFC 0002 §4 (`UserReview`, `Sanction`, strikes), §5 (Usuarios), §6 (suspendido). Estado: **borrador §1–§5 para aprobación de god**. Depende de 31 (`Appointment.NO_SHOW`) y 32 (`sendCriticalMail`/`SANCTION_APPLIED`).

## 1. Objetivo
**Problema:** `markNoShow` (`cases/appointments.ts`) solo marca la cita; no hay falta contada, ni forma de calificar o comentar a un usuario, ni sanciones. Quien falta repetidamente puede seguir solicitando y publicando.
**Resultado esperado:** cada NO_SHOW suma una falta; 3 faltas en 90 días → suspensión automática de 14 días (no puede solicitar ni publicar; ve aviso con motivo y fecha fin). El equipo califica (1–5) y comenta a usuarios (visible solo al equipo) y aplica WARNING/SUSPENSION; solo el Técnico aplica BAN o levanta sanciones.

## 2. Fuera de alcance
- Mostrar calificaciones o comentarios al usuario evaluado o a otros estudiantes (solo equipo).
- Sanciones a miembros del equipo (no se sanciona a `moderator`/`admin`).
- Apelaciones, reembolsos, tocar pagos o `canTransition`. Aplicar la migración (god).
**Decisiones que requieren aprobación:** D-A: el strike se crea al marcar NO_SHOW y vale para la parte ausente (`Appointment.partyId`); no cuenta si el equipo lo anula (Técnico "perdona" la falta → `forgivenAt`). D-B: la ausencia que ya cuenta la segunda falta de un caso no cancela el trato sola (spec 31 §4.4 sigue vigente). D-C: la suspensión automática se prolonga 14 días desde la 3.ª falta; mientras haya suspensión vigente no se crea otra automática. D-D: BAN solo lo aplica o levanta el Técnico; bloquea solicitar y publicar de forma indefinida pero no impide entrar, ver y llegar al aviso. D-E: una suspensión/BAN no cancela casos ya en curso: el trato sigue y el equipo decide.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `Strike`, `UserReview`, `Sanction`, enum `SanctionKind`; tipos de aviso `SANCTION_APPLIED`, `SANCTION_LIFTED` |
| `apps/api/prisma/migrations/20261009093000_faltas_sanciones/migration.sql` | crear | aditiva, no aplicada |
| `packages/shared/src/sanctions.ts`, `sanctions.test.ts`, `index.ts` | crear/modificar | esquemas y `countsTowardSuspension` |
| `packages/shared/src/notifications.ts` | modificar | tipos nuevos → `team`/`orders` |
| `apps/api/src/modules/sanctions/strikes.ts` | crear | registra falta dentro de la transacción de NO_SHOW y aplica suspensión automática |
| `apps/api/src/modules/sanctions/guard.ts` | crear | `assertNotSuspended(userId)` → 403 `ACCOUNT_SUSPENDED` con `reason`, `endsAt` |
| `apps/api/src/modules/sanctions/routes.ts`, `users.ts` | crear | `/staff/users` buscar, ficha, reseñas, sanciones |
| `apps/api/src/modules/sanctions/*.test.ts` | crear | strikes, guard, permisos, BAN solo admin |
| `apps/api/src/modules/cases/appointments.ts` | modificar | llamar `recordStrike` dentro de la transacción de `markNoShow` |
| `apps/api/src/modules/orders/create.ts`, `bazar/routes.ts`, `documents/listing.ts` | modificar | `assertNotSuspended` al solicitar / publicar |
| `apps/api/src/modules/auth/*`, `app.ts` | modificar | `GET /auth/me` expone `suspension {kind, reason, endsAt}` |
| `apps/api/src/modules/staff/routes.ts` | modificar | montar `/users` |
| `apps/api/docs/openapi.yaml` | modificar | rutas nuevas |
| `apps/web/src/components/equipo/UsuariosTab.tsx`, `UserCard.tsx`, `ReviewForm.tsx`, `SanctionForm.tsx` | crear | pestaña Usuarios |
| `apps/web/src/pages/Equipo.tsx` | modificar | pestaña Usuarios |
| `apps/web/src/components/SuspensionBanner.tsx`, `auth/AuthContext.tsx` | crear/modificar | aviso claro; botones deshabilitados con motivo |
| `apps/web/src/components/equipo/CaseCard.tsx` | modificar | botón de falta ya existe (NO_SHOW); muestra faltas del usuario |

## 4. Diseño y lógica
- **Datos:** `Strike { id, userId, appointmentId @unique, createdAt, forgivenAt?, forgivenById? }`; `UserReview { id, subjectId, authorId, caseId?, score 1–5, comment 0–500, createdAt }` (única por autor+caso+sujeto); `Sanction { id, userId, kind WARNING|SUSPENSION|BAN, reason 5–300, startsAt, endsAt?, byId?, auto bool, liftedAt?, liftedById? }`, índice `(userId, liftedAt, endsAt)`.
- **Falta:** `markNoShow` ya corre bajo el lock 300030; dentro de la misma transacción `recordStrike(partyId, appointmentId)` crea `Strike` (único por cita → idempotente) y cuenta faltas no perdonadas con `createdAt ≥ ahora−90 d`. Si ≥3 y no hay `Sanction` activa de tipo SUSPENSION/BAN → crea SUSPENSION `auto=true`, `endsAt = ahora+14 d`, motivo "3 faltas en 90 días". Aviso `SANCTION_APPLIED` + correo (spec 32) después del commit. Auditoría `strike.create`, `sanction.auto`.
- **Activa:** `liftedAt` nulo y (`endsAt` nulo o futuro). Suspensión/BAN bloquean `POST /orders`, `POST /bazar`, `POST /documents` (código `ACCOUNT_SUSPENDED`, 403, `message` con motivo y fecha fin; el ban sin fecha). Lectura y navegación siguen. `/auth/me` devuelve la sanción activa para el banner.
- **Equipo:** Trabajador y Técnico: buscar usuario (`GET /staff/users?q=`), ver historial (tratos, faltas, reseñas, sanciones), crear `UserReview`, aplicar WARNING o SUSPENSION (duración 1–30 días). **Solo Técnico:** BAN, levantar cualquier sanción (`POST /staff/users/:id/sanctions/:sid/lift`), perdonar falta. Un Trabajador solo levanta nada. No se sanciona a staff (409 `TARGET_IS_STAFF`). Toda acción con motivo y AuditLog; transacciones bajo el lock 300030 cuando afectan citas (no necesario aquí; basta transacción simple).
- **API:** `GET /api/v1/staff/users`, `GET /api/v1/staff/users/:id`, `POST /api/v1/staff/users/:id/reviews`, `POST /api/v1/staff/users/:id/sanctions`, `POST /api/v1/staff/users/:id/sanctions/:sid/lift`, `POST /api/v1/staff/users/:id/strikes/:strikeId/forgive`. Reseñas y comentarios nunca salen por rutas de usuario.
- **UI:** banner con motivo y fecha fin; botones "Solicitar/Publicar" deshabilitados con `aria-describedby`; tokens `primary*`, error `#b91c1c`; componentes <150 líneas.
- **Invariantes:** sin dinero; `canTransition` intacto.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 |
| A2 | Lint + any | lint con `--ignore-pattern 'hive/**'` y `any-budget --check` | 0 / 0 |
| A3 | Tests | `npm test` | verde; ≥20 nuevos: 1.ª/2.ª falta sin sanción, 3.ª → SUSPENSION 14 d, faltas >90 d no cuentan, perdonada no cuenta, no duplica suspensión, idempotencia por cita, bloqueo solicitar/publicar con código y fecha, BAN solo admin, Trabajador no levanta, staff no sancionable, reseñas ocultas al usuario |
| A4 | Contrato | `npm run docs:check` | 6 rutas |
| A5 | Tamaño | `wc -l` | ≤150 |
| A7 | Móvil | Equipo y banner a 375 px | 0 px |
| A10 | a11y | axe en Usuarios | 0 serias |
| A11 | E2E dev | 3 NO_SHOW de un estudiante → suspendido, ve fecha fin, `POST /orders` 403; Técnico levanta → vuelve a solicitar | pasa |

## 6. Checklist
- [ ] Modelo, migración y shared
- [ ] Faltas + suspensión automática
- [ ] Guard en solicitar/publicar + `/auth/me`
- [ ] Rutas de equipo (reseñas, sanciones, perdón)
- [ ] UI Usuarios + banner
- [ ] Gates A1–A5, registrar §7

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
