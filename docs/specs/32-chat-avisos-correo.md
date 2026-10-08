# Especificación 32 - Chat del caso y avisos por correo

Fuente: RFC 0002 §4 (`CaseMessage`), §6 (correo solo para eventos críticos). Estado: **aprobada por god (2026-10-08T22-02-14) con ajustes; implementada**.

## 1. Objetivo
**Problema:** el equipo y las partes de un caso (`HandoverCase`, spec 31) no tienen canal interno: cualquier coordinación va por fuera de la plataforma. Los avisos son solo in-app (`lib/notify.ts`); `lib/mailer.ts` solo envía reseteo y código de ingreso, y nada recuerda la cita el día antes.
**Resultado esperado:** (a) cada caso tiene un chat interno entre el trabajador/técnico y el vendedor y el comprador, sin costo; (b) los eventos críticos (solicitud nueva, aceptada, cita creada/cambiada, recordatorio del día antes, falta, sanción) además de la notificación llegan por correo; (c) un job diario envía el recordatorio un día antes de cada cita SCHEDULED.

## 2. Fuera de alcance
- Archivos adjuntos o imágenes en el chat (solo texto); chat en tiempo real (se consulta por petición; refresco al abrir y cada 30 s con la pestaña visible).
- Plantillas de correo de marketing; preferencias de correo por usuario (siempre se envían los críticos).
- Faltas/sanciones (spec 33): el tipo de aviso `SANCTION_APPLIED` y su correo los define la 33 y se engancha a `sendCriticalMail`.
- Aplicar la migración (la aplica god).
**Decisiones que requieren aprobación:** D-A: un mensaje del equipo genera aviso in-app `CASE_MESSAGE` pero **no** correo (el chat no es evento crítico); D-B (ajustada por god): el recordatorio se envía a las 08:00 America/Lima del último día hábil anterior a la cita (viernes para sábado; sábado para lunes; domingos y feriados no cuentan). Como Render gratis se duerme, el job **no es fiable**: cada pasada (y la del arranque) envía además los recordatorios atrasados de citas que aún no empezaron, y si la cita se agenda con menos de 24 h el recordatorio sale al agendar.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | modelo `CaseMessage`, `Appointment.reminderSentAt`, tipos de aviso `CASE_MESSAGE`, `ORDER_APPOINTMENT_REMINDER` |
| `apps/api/prisma/migrations/20261009090000_chat_recordatorios/migration.sql` | crear | aditiva, sin backfill, no aplicada |
| `packages/shared/src/chat.ts`, `chat.test.ts`, `index.ts` | crear/modificar | `CaseMessageSchema` (1–1000 car.), tipos |
| `packages/shared/src/notifications.ts` | modificar | mapa de tipos nuevos → `orders` |
| `apps/api/src/lib/mailer.ts` | modificar | método `sendNotice(to, subject, text, link)` con plantilla común |
| `apps/api/src/lib/criticalMail.ts`, `criticalMail.test.ts` | crear | conjunto de tipos críticos; envío best-effort tras `notify` |
| `apps/api/src/lib/notify.ts` | modificar | `notify` dispara correo si el tipo es crítico (nunca lanza; no bloquea) |
| `apps/api/src/modules/cases/chat.ts`, `chatRoutes.ts`, `chat.test.ts` | crear | listar/enviar por caso, permisos; un router montado en `/cases/:id/messages` y `/staff/cases/:id/messages` |
| `apps/api/src/modules/cases/reminders.ts`, `reminders.test.ts` | crear | instante de recordatorio, envío idempotente, gancho al agendar |
| `apps/api/src/lib/mailer.test.ts` | crear | escape HTML |
| `scripts/docs-check.mjs` | modificar | registrar `chatRoutes.ts` |
| `apps/api/src/modules/cases/routes.ts`, `queries.ts`, `appointments.ts` | modificar | una línea de enganche por archivo (montar chat; llamar `remindIfDue` tras agendar) |
| `apps/api/src/jobs/appointmentReminders.ts`, `jobs/index.ts` | crear/modificar | job de recordatorios (idempotente con `reminderSentAt`, también al arrancar) |
| `apps/api/docs/openapi.yaml` | modificar | rutas nuevas |
| `apps/web/src/components/orders/CaseChat.tsx` | crear | chat reutilizable (`base` = `/cases` o `/staff/cases`) |
| `apps/web/src/components/equipo/CaseCard.tsx`, `orders/BuyerCaseView.tsx` | modificar | una línea: chat en ficha del equipo y en Pedidos/Ventas/Checkout |

## 4. Diseño y lógica
- **Datos:** `CaseMessage { id, caseId→HandoverCase (restrict), authorId→User (restrict), body, createdAt }`, índice `(caseId, createdAt)`. `Appointment.reminderSentAt DateTime?` (nulo). Enum `NotificationType` += `CASE_MESSAGE`, `ORDER_APPOINTMENT_REMINDER`.
- **Permisos:** pueden leer/escribir el custodio asignado, cualquier Técnico, y el comprador y vendedor del pedido del caso. Un Trabajador no asignado no accede (404). Caso `UNASSIGNED` o `CANCELLED/CLOSED`: lectura sí, escritura solo si el caso no está cerrado/cancelado. Cuerpo 1–1000, texto plano (React lo escapa; el correo lo escapa HTML). Límite 30 mensajes/10 min por autor en caso (429).
- **API:** `GET /api/v1/cases/:id/messages` y `POST /api/v1/cases/:id/messages` (participantes, vía `participantCasesRouter`, accede por pertenencia al pedido) y `GET|POST /api/v1/staff/cases/:id/messages` (equipo). Respuesta `{data}` / `{error:{code,message}}`; códigos `CASE_CLOSED`, `RATE_LIMITED`. Auditoría `case.message` (sin cuerpo). Aviso in-app al resto de participantes (`CASE_MESSAGE`, enlace `/pedidos`, `/ventas` o `/equipo`), agrupado: no se crea otro aviso si ya hay uno `CASE_MESSAGE` sin leer del mismo caso para ese usuario.
- **Correo:** críticos = `ORDER_CREATED`, `ORDER_ACCEPTED`, `ORDER_APPOINTMENT_SCHEDULED`, `ORDER_APPOINTMENT_NO_SHOW`, `ORDER_APPOINTMENT_REMINDER`, `ORDER_CASE_ASSIGNED`, `ORDER_IN_CUSTODY`, y (spec 33) `SANCTION_APPLIED`. `notify()` tras crear el aviso busca el correo del usuario y llama `mailer.sendNotice`; cualquier fallo se registra y se ignora. Con `MAIL_DRIVER=console` se imprime (dev); los tests nunca llaman a Resend. Asunto = título del aviso; cuerpo = cuerpo + enlace absoluto (`WEB_ORIGIN[0]`+link).
- **Recordatorio:** `reminderDue(inicio, ahora)` = la cita es futura y (faltan <24 h **o** ya pasó el instante 08:00 Lima del último día hábil previo). Job cada 15 min (solo con `ENABLE_JOBS=true`) que además corre al arrancar el proceso; gancho `remindIfDue` en `bookCase`. Marca `reminderSentAt` con `updateMany` condicional (una sola instancia gana) y luego `notify(ORDER_APPOINTMENT_REMINDER)` al `partyId` y al `staffId`. **Limitación documentada:** si la API duerme (plan gratis) y nadie la despierta antes de la cita, el recordatorio no sale; el aviso al agendar y el de la pasada de arranque reducen el riesgo, no lo eliminan. Con `ENABLE_JOBS` apagado solo funciona el gancho al agendar.
- **Invariantes:** sin dinero ni `Order` modificados; `canTransition` no se toca.
- **UI:** `.card .input .btn`, tokens `primary*`, `SPRING`; componentes <150 líneas; lista con `aria-live="polite"`, caja con `aria-label`; altura reservada (CLS 0); 0 px scroll a 375 px.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint + any | `npm run lint -- --ignore-pattern 'hive/**'` y `node scripts/any-budget.mjs --check` | 0 / 0 |
| A3 | Tests | `npm test` | verde; ≥14 nuevos: `chat.test.ts` (permisos comprador/vendedor/custodio/técnico/ajeno, caso cerrado, rate limit, agrupado), `criticalMail.test.ts` (solo críticos, fallo no lanza, escape HTML), `reminders.test.ts` (D-B fines de semana/feriados, atrasados, <24 h, idempotencia, dos instancias), shared `chat.test.ts` |
| A4 | Contrato | `npm run docs:check` | verde; 4 rutas nuevas |
| A5 | Tamaño | `wc -l` de fuentes tocadas | ≤150 |
| A7 | Móvil | Pedidos/Equipo a 375 px | 0 px de exceso |
| A10 | a11y | axe en chat | 0 serias/críticas |
| A11 | E2E dev | vendedor escribe → técnico/custodio lo ve y responde; ajeno 404; cita mañana → un solo recordatorio por correo console | pasa |

## 6. Checklist
- [x] Modelo, migración y shared
- [x] Rutas de chat + permisos
- [x] Correo crítico + job de recordatorios
- [x] UI equipo y participantes
- [x] Gates A1–A5 locales, registrar §7 (A7/A10/A11 pendientes en dev por god)

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1 | ✅ | tsc api+web con alias al shared/Prisma del worktree (el `node_modules` es compartido con el repo principal y de solo lectura en el sandbox; solo queda el error previo ajeno `idToken.ts` `JsonWebKey`) |
| 2026-10-08 | A2 | ✅ | `npm run lint -- --ignore-pattern 'hive/**'` 0 errores/0 warnings; `any-budget --check` 0 <= 0 |
| 2026-10-08 | A3 | ✅* | API 291 verdes / shared 68 verdes (incl. 31 nuevos: chat 12, reminders 11, criticalMail 4, mailer 1, shared chat 3). *1 fallo esperado hasta regenerar Prisma: `notifications/routes.test.ts` compara el mapa con el enum del cliente Prisma instalado (no incluye `CASE_MESSAGE`/`ORDER_APPOINTMENT_REMINDER`); pasa tras `prisma generate` |
| 2026-10-08 | A4 | ✅ | `npm run docs:check` 81 rutas (+2 paths: `/cases/{id}/messages`, `/staff/cases/{id}/messages`; scanner registra `chatRoutes.ts`) |
| 2026-10-08 | A5 | ✅ | chat.ts 44, chatRoutes.ts 15, reminders.ts 49, criticalMail.ts 26, CaseChat.tsx 41 líneas |
| — | A7, A10, A11 | pendiente | requiere dev con migración aplicada (god) |
