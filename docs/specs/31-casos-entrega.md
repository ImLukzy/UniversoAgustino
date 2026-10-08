# Especificación: 31 - Casos de entrega mediados por el equipo

Aprobada por god en 2026-10-08T21-20-44-548Z-7aa8b2. Fuente: RFC 0002 §3–§6; decisiones fijas del despacho 2026-10-08T21-16-10-013Z-d66c0f.

## 1. Objetivo
**Problema:** al aceptar un pedido del bazar, `orders/sellerSteps.ts` solo cambia Order y anuncia pago al vendedor; `buyerSteps.ts`, la pasarela y Checkout todavía permiten pagar en la web. No existen casos, citas, recepción física ni devolución de alquileres.
**Resultado esperado:** aceptar compra/alquiler crea un caso UNASSIGNED atómicamente. El equipo asigna trabajador, programa citas dentro de sus turnos y recibe el objeto con foto/nota; el comprador recibe sede/punto/hora/foto/precio. Al recoger, paga al vendedor delante del trabajador; este registra operación o efectivo y completa los estados del pedido. El alquiler conserva el objeto RENTED hasta su devolución y entrega al vendedor.

**División aprobada:** el objetivo completo toca aproximadamente 40–45 archivos, supera el umbral de ~25. God aprobó dos entregas:
- **31a:** modelos/migración, creación del caso, asignación, cita DROP_OFF, recepción con foto/nota, programación PICKUP para poder avisar al comprador con fecha/hora, NO_SHOW y una reprogramación; vistas básicas del caso y cierre de todos los pagos web del bazar. Termina en PICKUP_SCHEDULED; el pedido sigue ACCEPTED.
- **31b:** ejecutar recojo con pago verificado, venta cerrada; alquiler RENTED, cita RETURN, revisión de devolución y cita BACK_TO_SELLER, cierre/liberación; cancelación con retorno del objeto cuando ya está en custodia.

31a contiene la programación del recojo porque el aviso obligatorio de recepción debe incluir fecha y hora. 31b ejecuta el recojo. Aun dividida, 31a requiere alrededor de 30 archivos por las integraciones existentes; no se fusionarán módulos para eludir el límite de 150 líneas.

## 2. Fuera de alcance
- Chat y correos/recordatorios de spec 32; faltas, puntuaciones y sanciones de spec 33; agenda semanal/métricas de spec 34.
- Cobrar comisión, custodiar dinero, crear una pasarela física o modificar pagos de documentos PDF.
- Ejecutar migraciones/backfill/seed; god aplica en dev y prod requiere OK humano. Sin commit/push.

**Fijo, ya autorizado:** pago solo al recoger delante del trabajador; estados Order solo mediante canTransition; citas dentro de turnos y sin solape; plazos de 3 días hábiles sin domingos/feriados; foto interna obligatoria y nota; NO_SHOW de cita; tipos nuevos de aviso en la migración.

**Decisiones aprobadas por god:**
1. División 31a/31b anterior; slots de 15 minutos; el plazo cuenta 3 días hábiles siguientes al evento, vence al cierre del tercer día (sábado abierto cuenta; domingo nunca). Se permite citar hoy si la franja aún es futura.
2. Reasignar antes de recibir cancela citas pendientes y exige programar nuevas; después de recibir no se cambia custodio sin transferencia física, fuera de esta entrega.
3. No backfill automático de pedidos bazar ACCEPTED anteriores. Se bloquea su pago web igualmente; God verificó que producción no tiene pedidos de bazar y autorizó dejar legacy dev sin caso. Ningún pedido ni snapshot existente se reescribe en la migración.
4. Una sola reprogramación por caso y tipo de cita tras NO_SHOW. Segunda ausencia conserva el caso para decisión del Técnico (cancelar antes de custodia; devolver objeto en 31b). No sanciones automáticas.
5. Turnos con citas futuras SCHEDULED no pueden editarse/eliminarse si la cita queda fuera; no quitar del equipo un trabajador con casos activos o citas futuras hasta reasignar/cancelar. Evita invalidar asignaciones desde la administración de spec 30/26.

## 3. Archivos afectados
Rutas actuales verificadas en repo; los nuevos archivos se crean en los directorios indicados. 31a autorizada; 31b autorizada por despacho c6938d.

| Archivos | Acción | Entrega / propósito |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | 31a: casos/citas/relaciones/enums; incluye estados posteriores sin usarlos hasta 31b |
| `apps/api/prisma/migrations/20261008211600_casos_entrega/migration.sql` | crear | 31a: aditiva y enums de avisos, sin aplicar ni backfill |
| `packages/shared/src/handover.ts`, `handover.test.ts`, `index.ts` | crear/modificar | 31a: contratos, estados de caso/cita, esquemas; 31b extiende ejecución/revisión |
| `packages/shared/src/notifications.ts` | modificar | 31a: mapa completo de nuevos tipos → orders |
| `apps/api/src/modules/cases/routes.ts`, `queries.ts`, `assignment.ts`, `appointments.ts`, `receive.ts`, `calendar.ts`, `caseGuard.ts` | crear | 31a: consultas, permisos, asignar/tomar, citas, recepción y reglas temporales |
| `apps/api/src/modules/cases/cases.test.ts`, `appointments.test.ts`, `calendar.test.ts` | crear | 31a: contratos, transacciones, calendario/NO_SHOW/reprogramación |
| `apps/api/src/modules/cases/pickup.ts`, `returns.ts`, `close.ts`, `fulfillment.test.ts` | crear | 31b: pago al recoger, devolución y cierre/retorno seguro |
| `apps/api/src/modules/staff/routes.ts`, `shifts.ts`, `shifts.test.ts` | modificar | 31a: montar cases; proteger baja del custodio y turnos con citas futuras |
| `apps/api/src/app.ts` | modificar | 31a: lectura de casos de participantes |
| `apps/api/src/modules/orders/sellerSteps.ts`, `buyerSteps.ts`, `closeSteps.ts`, `requests.test.ts` | modificar | 31a: aceptación+caso atómica, impedir acciones financieras/cancelaciones incompatibles; 31b ejecuta via case |
| `apps/api/src/modules/payments/routes.ts`, `settle.ts`, `checkout.test.ts`, `payments.test.ts` | modificar | 31a: impedir checkout/webhook para bazar; documentos intactos |
| `apps/api/docs/openapi.yaml`, `scripts/docs-check.mjs` | modificar | 31a/31b: rutas y escáner modular |
| `apps/web/src/pages/Equipo.tsx` | modificar | 31a: pestaña Casos |
| `apps/web/src/components/equipo/CasesTab.tsx`, `CaseCard.tsx`, `CaseAssignment.tsx`, `AppointmentForm.tsx`, `ReceiveForm.tsx`, `caseTypes.ts` | crear | 31a: tablero/ficha, trabajador, citas, foto/nota, fechas/mensajes/acciones por rol |
| `apps/web/src/components/equipo/PickupForm.tsx`, `ReturnForm.tsx` | crear | 31b: operación/efectivo, revisión de devolución, retorno al vendedor |
| `apps/web/src/components/orders/BuyerCaseView.tsx`, `BuyerOrderRow.tsx` | crear/modificar | 31a: sede, punto, trabajador, cita, foto, precio y estado del caso en Pedidos/Panel |
| `apps/web/src/components/RentalCard.tsx`, `SaleActions.tsx` | modificar | 31a: vendedor ve cita/estado, sin confirmar pagos físicos por web |
| `apps/web/src/pages/Checkout.tsx` | modificar | 31a: bazar muestra instrucciones/cita; PDF mantiene QR y flujo actual |
| `docs/specs/31-casos-entrega.md` | modificar | aprobación, posterior checklist y §7; crear specs 31a/31b solo tras acuerdo |

Schema/OpenAPI exentos de 150 líneas; todos los módulos/componentes ≤150. Si hacen falta más archivos se explicará antes de ampliarlos.

Integraciones necesarias adicionales en 31a: `cases/orderChanges.ts` separa aceptación/cancelación atómicas para mantener módulos ≤150 líneas; `cases/scheduleProtection.ts` protege turnos y feriados; `cases/cancel.ts` y su test añaden cancelación previa por equipo autorizada por god b83589; Pedidos/Ventas/DigitalSales actualizan instrucciones y foco accesible; `staff/schedule.ts` llama esa protección y `lib/notify.ts` reutiliza el tipo compartido de avisos.

## 4. Diseño y lógica
### Datos y estados
- `HandoverCase`: id, orderId único→Order (restrict), assigneeId opcional→User, status, sedeId opcional→Sede, receivedPhotoUrl, conditionNote, receivedAt, paymentRef, paymentMethod, closedAt, createdAt/updatedAt. Relaciones de participantes vienen de Order; no copiar comprador/vendedor.
- Estados: UNASSIGNED → ASSIGNED → DROP_SCHEDULED → IN_CUSTODY → PICKUP_SCHEDULED → DELIVERED → CLOSED (venta); alquiler PICKUP_SCHEDULED → RENTED_OUT → RETURN_SCHEDULED → RETURNED → BACK_TO_SELLER → CLOSED. CANCELLED solo cuando no queda un objeto bajo custodia. Transiciones definidas en shared y verificadas en servidor; historial AuditLog.
- `Appointment`: id, caseId→HandoverCase, kind DROP_OFF/PICKUP/RETURN/BACK_TO_SELLER, partyId→User, staffId→User, sedeId→Sede, shiftId opcional→StaffShift, startsAt/endsAt UTC, status SCHEDULED/DONE/NO_SHOW/CANCELLED, rescheduledFromId opcional→Appointment, createdAt/updatedAt. FK shift SetNull para preservar historia, cambios futuros protegidos por API. Índices staffId+status+startsAt y caseId+kind; referencia de reprogramación única y una SCHEDULED por caseId+kind (índice parcial).
- La migración crea ambos modelos/enums y añade NotificationType: ORDER_CASE_ASSIGNED, ORDER_APPOINTMENT_SCHEDULED, ORDER_APPOINTMENT_NO_SHOW, ORDER_IN_CUSTODY, ORDER_PICKUP_COMPLETED, ORDER_RETURN_COMPLETED. Todos en categoría orders; enum y mapa deben concordar en tests existentes de notifications.
- Foto: ruta `/uploads/...`, archivo existente JPG/PNG del trabajador que recibe; nota 5–500. Nada de URLs externas ni archivos PDF como foto. Operación 3–160 o método CASH con referencia guardada «efectivo»; no foto de pago obligatoria.

### Transacciones, roles y citas
- Al aceptar bazar: dentro de una transacción reclamar PENDING no vencido mediante updateMany condicional, comprobar canTransition→ACCEPTED, crear caso único UNASSIGNED, escribir AuditLog; aviso después del commit. Cualquier fallo revierte aceptación y caso; doble aceptar→409.
- Todas las mutaciones de caso/cita usan el lock de transacción 300030, compartido con horarios/turnos/sedes. Releer estado, comprobar permisos y disponibilidad bajo el lock; auditoría en la misma transacción. Sin comprobaciones previas fuera del lock para decisiones de concurrencia.
- Técnico consulta todos/asigna/reasigna; Trabajador ve sin asignar o propios, toma caso sin asignar y gestiona solo los propios. Comprador/vendedor solo leen sus casos y franjas apropiadas; nunca registran recepción, pago, DONE ni NO_SHOW. Usuario ajeno no ve fotos/datos por el API de casos.
- Tomar caso o asignar requiere trabajador actual y cuenta activa del equipo. Dos tomas concurrentes → una gana y otra409. Reasignar antes de custodia cancela citas futuras anteriores y avisa a participantes; no borrar historial.
- Cita local America/Lima: fecha real futura, misma fecha para inicio/fin, 15 minutos, minuto alineado a 15, sede activa, día hábil abierto/no feriado y dentro de turno del trabajador en esa sede; intervalo contenido en OpeningHours.
- Solape: startsAtA < endsAtB y endsAtA > startsAtB, por trabajador entre todas las sedes, solo SCHEDULED; contiguas permitidas. Consultar y crear bajo el lock. Reprogramar cancela/reemplaza conservando historial y cupo; cupo no puede ganarse con dos requests concurrentes.
- Plazo DROP_OFF anclado a acceptedAt; PICKUP a receivedAt; contar días locales abiertos siguientes, excluir domingos/feriados/cierres; límite al cierre del tercero. Sin horario útil dentro de un horizonte acotado → NO_AVAILABILITY. RETURN toma rentalEnd como fecha objetivo y debe respetar turno/horario; no alterar fechas de alquiler sin aprobación adicional.
- NO_SHOW solo tras endsAt y si sigue SCHEDULED; lo marca el custodio o Técnico. Mantiene el estado adecuado para una reprogramación; ningún strike, sanción, liberación prematura ni cobro. Segunda ausencia solicita decisión del Técnico.
- Recibir requiere DROP_OFF programada válida del caso y trabajador asignado; foto/nota obligatorias; cita→DONE y caso→IN_CUSTODY. Programar PICKUP después fija sede/franja y caso→PICKUP_SCHEDULED; aviso al comprador contiene trabajador, sede, dirección/punto, fecha/hora local, foto y precio snapshot. En 31a ambos pasos quedan implementados y visibles.
- Avisos solo después de commit; tipo del evento específico, enlace `/pedidos` para comprador, `/ventas` para vendedor, `/equipo` para equipo. No correo en esta spec.

### Pago físico y devolución (31b)
- Solo custodio/Técnico al ejecutar cita PICKUP, con operación/efectivo. Releer caso/order bajo lock; verificar cada transición con canTransition: ACCEPTED→PAID→ESCROW; crear Escrow y auditorías. Venta añade ESCROW→RELEASED, escrow.releasedAt, artículo SOLD, caso DELIVERED→CLOSED y cita DONE, todo en la misma transacción.
- Alquiler permanece ESCROW, artículo RENTED, caso RENTED_OUT; al recibir RETURN con revisión/nota, cita DONE, caso RETURNED y Order ESCROW→RELEASED. Programar/ejecutar BACK_TO_SELLER; solo al devolver físicamente al vendedor artículo AVAILABLE y caso CLOSED. Avisos en ambos hitos; nunca poner AVAILABLE mientras el equipo conserva el objeto.
- Pedidos bazar no permiten /pay, /confirm-payment, /confirm-receipt ni pasarela por participante. Webhook bazar nunca actualiza estados: registrar como ORPHAN para conciliación manual; PDFs intactos. QR/constancia/pago web desaparecen del checkout bazar desde 31a, mostrando pago al recoger.
- Cancelación previa a custodia: Order ACCEPTED→CANCELLED por canTransition, caso/citas CANCELLED, liberar RESERVED. En custodia se rechaza cancel directo y se exige retorno asistido en 31b; no ocultar ni liberar stock antes de devolver objeto.

### API y UI
Contrato existente `{data}`/`{error:{code,message}}`; prefijo `/api/v1`.
- 31a: `GET /staff/cases` paginado por estado/custodio; `GET /staff/cases/:id`; `POST /staff/cases/:id/take`; `POST /staff/cases/:id/assign` (solo Técnico); `GET /staff/cases/:id/slots?kind=DROP_OFF|PICKUP`; `POST /staff/cases/:id/appointments`; `POST /staff/cases/:id/appointments/:appointmentId/no-show`; `POST /staff/cases/:id/appointments/:appointmentId/reschedule`; `POST /staff/cases/:id/receive`; `POST /staff/cases/:id/cancel` antes de custodia.
- Participantes: `GET /cases/order/:orderId` con datos mínimos, citas pertinentes, snapshot del precio, nombre del trabajador, sede/punto y foto; sin correos ni otros casos. Opcional elección de otra franja PICKUP mediante endpoint de solicitud controlado por el custodio: no implementar cambio libre de trabajador/sede por comprador en 31a.
- 31b: `POST /staff/cases/:id/pickup`; `POST /staff/cases/:id/return`; `POST /staff/cases/:id/back-to-seller`; `POST /staff/cases/:id/cancel`. Slots/appointments amplían kinds RETURN/BACK_TO_SELLER.
- Errores: 400 VALIDATION/BAD_PHOTO; 401/403 autorización; 404 NOT_FOUND; 409 BAD_STATE, ALREADY_ASSIGNED, SLOT_TAKEN, OUTSIDE_SHIFT, DAY_CLOSED, DEADLINE_EXCEEDED, NO_AVAILABILITY, RESCHEDULE_LIMIT, HAS_CASES/HAS_APPOINTMENTS.
- Equipo/Casos: filtros, lista paginada, ficha con historial y acciones por rol; selector trabajador/sede y franjas reales, subir JPG/PNG y nota para recibir. NO_SHOW/reprogramación con confirmación. 31b añade operación/efectivo y revisión/retorno.
- Pedidos y Ventas: estado, citas de su parte, sede/punto, foto y precio. Checkout bazar solo instrucciones, nunca QR/pago. PDF mantiene flujo. Clases card/input/btn/chip, tokens primary, SPRING si hay motion; min-w-0, wrap, carga con altura reservada, errores accesibles.

## 5. Criterios de aceptación
Se ejecutan por entrega aprobada, con alcance completo verificable al cerrar 31b.

| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | build shared, Prisma regenerado por god, typecheck raíz | 0 errores |
| A2 | Lint | lint producto excluyendo hive (exclusión operativa aprobada) | 0 errores/warnings |
| A3 | Tests | npm test completo por god fuera del sandbox | ≥25 nuevos en31a y ≥15 en31b; todos verdes |
| A4 | API/enums | docs:check + negativa; enum Prisma vs mapa compartido | todas las rutas documentadas y todos los tipos categorizados |
| A5 | Tamaño | wc -l de fuentes tocadas | ≤150; schema/OpenAPI exentos |
| A7 | Móvil | god /equipo Casos, /pedidos, /ventas, checkout bazar a375 | 0 px de scroll horizontal |
| A8 | Build | npm run build y gzip de entrada+preload/chunks | inicial<170KB; chunk Equipo<25KB; sin nuevas dependencias |
| A10 | Accesibilidad | god axe formularios de citas/recepción/pago/revisión | 0 violaciones serias/críticas |
| A11a | Caso y custodia | god dev: aceptar venta y alquiler; tomar/asignar; DROP_OFF válida; foto/nota; PICKUP y aviso completo | pasa; aceptación+caso/audit atómica; ninguna ruta web física paga |
| A11b | Pago y devolución | god dev: recojo con operación y CASH; venta y alquiler completos | venta RELEASED/SOLD/CLOSED; alquiler ESCROW/RENTED hasta devolver, luego RELEASED y AVAILABLE solo al regresar al vendedor |
| A11c | Tiempo/concurrencia/permisos | tests + god dev dos tomas/citas en paralelo, domingo/feriado, fuera turno, plazo3días, NO_SHOW/reprogramar | una gana y otra409; contiguas sí; tercera reprogramación imposible; terceros403/404; no pagos/repeticiones duplicadas |
| A11d | Regresión digital | god pedido PDF y suite existente | TTL30min, QR/pago, acceso PDF y estados actuales intactos |

Tests mínimos31a: rollback de aceptación sin caso; caso único en carrera; lectura de participantes y ajenos; toma/asignación/autorización; solape entre sedes/turnos/feriados/plazo (sábado incluido); foto interna existente propia e imagen; recepción y aviso; NO_SHOW temprano/repetido; límite de reprogramación; protección de turnos/custodio; todos los pagos web bazar bloqueados. Tests31b: operación/CASH requeridos, cada transición canTransition, venta atómica, alquiler no libera inventario antes del retorno, devolución/revisión, citas restantes y cancelación asistida, idempotencia y permisos.

## 6. Estado de entregas
- [x] 31a — integrada por god383fde1; KellyAPTO/E2E/suite404 (detalle en `31a-casos-custodia.md`).
- [ ] 31b — en implementación tras despacho c6938d (detalle en `31b-recojo-devoluciones.md`).

## 7. Evidencia
31a: migración aplicada en dev y Prisma regenerado por god, mensaje 2026-10-08T21-24-05-568Z-73493a. No backfill. SQL aplicado no vuelve a editarse. No commit/push por Michael.
| 2026-10-08 | Migración dev | Pasa (god) | `20261008211600_casos_entrega` aplicada en Unsa; migrate diff limpio salvo 2 índices crudos previos. |
| 2026-10-08 | A11 31a (god, BD dev, 375 px) | Pasa con 4 arreglos pedidos | Venta: caso UNASSIGNED al aceptar; pago web y checkout 409; toma doble 409/200; cita doble 409/201; fuera de turno 409; recepción: antes de hora 409, no custodio 403, foto externa 400, OK → IN_CUSTODY; reasignar en custodia 409; PICKUP_SCHEDULED con aviso completo y foto en `/pedidos`. Alquiler: no-show antes del fin 409, no-show 200, 1 reprogramación, 2ª 409 RESCHEDULE_LIMIT. Pendiente: caso atascado tras agotar reprogramación, ruta de foto en el aviso, texto de custodia obsoleto, axe `/ventas`. |
| 2026-10-08 | Auditoría 31a | Pasa (previa a arreglos E2E) | Kelly APTO sin hallazgos sobre d2c21f5; la acción "Cancelar trato" (arreglo 1 del E2E) requerirá revisión puntual. |
| 2026-10-08 | A3 + A11 arreglos 31a | Pasa | God: typecheck 0, lint 0/0, docs:check 79, any-budget 0, secrets OK; tests API 259, web 80, shared 65 (404). E2E: estudiante cancela 403; cancelar en custodia 409; custodio cancela tras 2 ausencias → caso/pedido CANCELLED, ítem AVAILABLE, citas intactas como NO_SHOW; 2ª cancelación 409; avisos ORDER_CANCELLED a comprador y vendedor; `/pedidos` explica pago al recoger sin QR; axe `/ventas` y `/pedidos` ok. (El aviso con ruta de foto que queda en dev es previo al arreglo.) |
| 2026-10-08 | Auditoría delta | Pasa | Kelly APTO sin hallazgos en Cancelar trato y los 3 ajustes. |
| 2026-10-08 | Migración dev 31b | Pasa (god) | `20261008214900_casos_devolucion` aplicada en Unsa; diff limpio salvo 2 índices previos. |
| 2026-10-08 | A3 31b | Pasa | God fuera del sandbox: typecheck 0, lint 0/0, docs:check 84, any-budget 0; tests API 288, web 80, shared 71 (439). check-secrets solo marca `worktrees/` del temp (no rastreado, falso positivo). |
| 2026-10-08 | A11 31b (god, BD dev, 375 px) | Pasa | Venta: pickup sin confirmar 400, operación sin n.º 400, estudiante 403, antes de hora 409, OK → pedido RELEASED/ítem SOLD/caso CLOSED, repetir 409; comprador no confirma cobro (404), vendedor confirma 200 y reporta 201 sin cambiar el pedido; aviso al vendedor con monto y n.º. Alquiler con fin en domingo: primera franja RETURN lunes 08:00 Lima; pickup en efectivo → ESCROW/RENTED/RETURN_SCHEDULED; return sin confirmar 400, OK → RELEASED con ítem aún RENTED; back-to-seller → ítem AVAILABLE, caso CLOSED. Recojo con 2 ausencias: 2ª reprogramación 409, retorno al vendedor → pedido CANCELLED, ítem AVAILABLE, caso CLOSED. `/equipo` Casos, `/pedidos`, `/ventas`: 0 px y axe ok. |
| 2026-10-08 | Auditoría 31b | Pasa | Kelly APTO sin hallazgos (pago certificado, canTransition, ítem nunca liberado antes del retorno físico, roles, foto propia, AuditLog). |
