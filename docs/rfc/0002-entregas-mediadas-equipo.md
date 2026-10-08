# RFC 0002 — Entregas mediadas por el equipo (bazar)

Estado: **propuesto por god, pedido del humano 2026-10-08**. Fuente de verdad para las specs 28–34.

## 1. Qué resuelve
Hoy comprador y vendedor del bazar se arreglan solos: el pago va por Yape directo, el vendedor confirma su propio cobro, la "custodia" es solo un estado y un alquiler nunca vuelve a "Disponible". El humano quiere que **el equipo (trabajadores UNSA) medie cada trato físico**: recibe el producto del vendedor, lo guarda y lo entrega al comprador en una sede, fecha y hora; y que pueda calificar y sancionar a quien falle.

## 2. Decisiones de diseño (tomadas por god; cambiables)
| # | Decisión | Por qué |
|---|---|---|
| D1 | Solo aplica al **bazar** (libros, scrubs, instrumentos: objetos físicos). Los apuntes PDF siguen como hoy (digital, sin entrega). | Lo físico es lo que necesita custodia. |
| D2 | **El equipo custodia el objeto, nunca el dinero.** El comprador paga al vendedor (Yape/Plin/efectivo según el anuncio) **en el momento de recoger, delante del trabajador**, que registra el n.º de operación y recién entonces entrega. | Coste cero, sin pasarela ni comisiones, sin que el equipo maneje plata de terceros. |
| D3 | **Sin comisión** (humano 2026-10-08): 0 %, spec 35. | El equipo no cobra ni toca dinero. |
| D4 | Roles visibles: `admin` = **Técnico**, `moderator` = **Trabajador**. Solo cambia la etiqueta. | Sin migración de roles. |
| D5 | Los trabajadores siguen usando la web como cualquier estudiante; desde el **menú del perfil** entran a **Mi panel**. | Pedido explícito. |
| D6 | Horario hábil UNSA: **lunes–viernes 08:00–18:00, sábado 08:00–13:00 (especial)**; domingo y feriados cerrados. Todo configurable por el técnico. | Pedido explícito; valores por defecto razonables. |
| D7 | Sedes: lista que administra el técnico (nombre, dirección, punto de encuentro, foto opcional). Arranca con las tres áreas de la UNSA en Arequipa: **Ingenierías, Sociales y Biomédicas** (confirmado por el humano); el punto de encuentro lo completa el técnico. | Una sola universidad, una ciudad. |

## 3. Flujo
```
Comprador ve producto ──► "Solicitar compra/alquiler" (fechas si es alquiler, sede preferida)
   │                                     Order PENDING · aviso al vendedor
   ▼
Vendedor: Aceptar / Rechazar (motivo) — 48 h o vence
   │ Rechaza → CANCELLED, aviso al comprador, producto vuelve a Disponible
   ▼ Acepta → ACCEPTED · producto RESERVED · se crea el CASO (sin asignar) en Mi panel
Equipo: un trabajador toma el caso (o el técnico lo asigna)
   ▼
Cita de ENTREGA del vendedor (sede/hora dentro del turno del trabajador) — 3 días hábiles
   │ No viene → NO_SHOW vendedor (falta), reprograma 1 vez o se cancela el trato
   ▼ Trabajador recibe: foto de recepción + estado del objeto → EN CUSTODIA
Aviso al COMPRADOR: "Tu producto está en recepción con <trabajador>. Recógelo en <sede, punto>,
   <fecha, hora>" + foto + precio acordado. Puede elegir otra franja disponible.
   ▼
Cita de RECOJO — 3 días hábiles
   │ No viene → NO_SHOW comprador (falta), reprograma 1 vez o se devuelve al vendedor
   ▼ Comprador paga al vendedor delante del trabajador → trabajador registra n.º operación
   Venta:    PAID → ESCROW → RELEASED · producto SOLD · caso CERRADO
   Alquiler: PAID → ESCROW · producto RENTED · cita de DEVOLUCIÓN en la fecha fin
             devuelve → trabajador revisa estado → RELEASED · cita para devolver al vendedor
             → producto AVAILABLE · caso CERRADO
```
Toda transición de `Order` pasa por `canTransition` (PENDING→ACCEPTED→PAID→ESCROW→RELEASED / CANCELLED / REFUNDED): no se cambia la máquina de estados, se le cuelga el **Caso**.

## 4. Datos nuevos (migraciones aditivas)
- `Sede { id, name, address, meetingPoint, photoUrl?, active }`
- `OpeningHours { weekday 0–6, opens, closes, special bool }` + `Holiday { date, reason }`
- `StaffShift { userId, sedeId, weekday, startsMin, endsMin }` (turnos de cada trabajador)
- `HandoverCase { id, orderId @unique, assigneeId?, status, sedeId?, receivedPhotoUrl?, conditionNote?, paymentRef?, closedAt? }`
  status: `UNASSIGNED → ASSIGNED → DROP_SCHEDULED → IN_CUSTODY → PICKUP_SCHEDULED → DELIVERED → (alquiler) RENTED_OUT → RETURN_SCHEDULED → RETURNED → BACK_TO_SELLER → CLOSED`, más `CANCELLED`.
- `Appointment { id, caseId, kind DROP_OFF|PICKUP|RETURN|BACK_TO_SELLER, partyId, staffId, sedeId, startsAt, endsAt, status SCHEDULED|DONE|NO_SHOW|CANCELLED, rescheduledFromId? }` — no se solapan citas del mismo trabajador.
- `CaseMessage { caseId, authorId, body, createdAt }` (chat interno trabajador ↔ vendedor/comprador; sin costo).
- `UserReview { subjectId, authorId (equipo), caseId?, score 1–5, comment }` (visible solo al equipo).
- `Sanction { userId, kind WARNING|SUSPENSION|BAN, reason, startsAt, endsAt?, byId, liftedAt? }` + `strikes`: cada NO_SHOW suma una falta; **3 faltas en 90 días → suspensión automática de 14 días** (no puede solicitar ni publicar); el técnico puede levantar o aplicar sanciones manuales.
- `NotificationType` + tipos del flujo; `Notification.readAt` ya existe → centro de avisos.

## 5. Mi panel (trabajador / técnico)
- **Hoy:** citas del día por hora y sede, qué productos tiene cada trabajador en custodia.
- **Casos:** tablero por estado; tomar / asignar / reasignar; ficha con línea de tiempo, foto, chat, citas, botón de falta.
- **Agenda:** semana lunes–sábado × franjas de 15 min; filtros por sede y trabajador; quién recibe, quién tiene qué y con quién se reúne.
- **Publicaciones:** cola de revisión (spec 27).
- **Usuarios:** buscar, ver historial de tratos, faltas, calificaciones, comentarios; sancionar / levantar.
- **Sedes y horarios** (técnico): sedes, horario hábil, sábados, feriados, turnos de trabajadores.
- **Miembros** (técnico) y **Denuncias**: ya existen (spec 26).

## 6. Usuario normal
- Botón "Solicitar compra/alquiler" en vez de pagar directo; estado del trato paso a paso en `/pedidos` con la cita, sede, foto y precio.
- Vendedor: bandeja "Solicitudes" con Aceptar/Rechazar.
- **Notificaciones** rediseñadas: contador de no leídas en el header, agrupadas por trato, filtros, "marcar todo leído", enlace directo a la acción; correo (Resend, ya integrado) solo para eventos críticos (solicitud nueva, aceptada, cita creada/cambiada, recordatorio el día antes, falta, sanción).
- Si está suspendido: aviso claro con motivo y fecha fin; puede ver pero no solicitar ni publicar.

## 7. Plan de specs (en orden)
| Spec | Entrega | Migración |
|---|---|---|
| 27 | Revisión de publicaciones (en curso; todo pasa por el equipo) | sí (dev aplicada) |
| 28 | "Mi panel" en el menú del perfil + etiquetas Técnico/Trabajador + centro de notificaciones | no |
| 29 | Solicitud → aceptar/rechazar del vendedor (venta y alquiler del bazar), vencimiento 48 h | no (usa Order) |
| 30 | Sedes, horario hábil, sábados, feriados y turnos de trabajadores | sí |
| 31 | Casos de entrega: asignación, citas sin solape, custodia con foto, recojo con pago verificado, alquiler y devolución | sí |
| 32 | Chat del caso + avisos y recordatorios por correo | sí |
| 33 | Faltas, calificaciones, comentarios y sanciones (automáticas y manuales) | sí |
| 34 | Agenda semanal y métricas del panel | no |

## 8. Riesgos y cómo se cubren
- **Doble reserva del producto:** índice parcial existente de pedido activo por ítem + `RESERVED` al aceptar.
- **Citas solapadas:** validación en API por trabajador y franja; la agenda solo ofrece huecos libres dentro de turnos.
- **Producto perdido en custodia:** foto y nota de estado al recibir; el caso registra quién lo tiene en cada momento (AuditLog).
- **Pago no hecho al recoger:** el trabajador no marca entregado sin n.º de operación o "efectivo" confirmado; el vendedor recibe aviso para confirmar.
- **Abuso de sanciones:** toda sanción con motivo, autor y AuditLog; solo el técnico aplica BAN o levanta.
