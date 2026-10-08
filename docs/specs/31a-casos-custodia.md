# Especificación 31a — Casos, citas y custodia

## 1. Objetivo
Aceptar venta o alquiler del bazar crea Order ACCEPTED y un caso UNASSIGNED en una transacción. El equipo asigna custodio, programa entrega, recibe foto/nota y programa recojo. El pedido sigue ACCEPTED y paga físicamente al recoger. Contrato completo y decisiones aprobadas: [spec 31](31-casos-entrega.md).

## 2. Fuera de alcance
Ejecutar recojo/pago, devolución y retorno físico (31b); chat, recordatorios, sanciones y agenda (32–34). Sin backfill, aplicar SQL, commit ni push por Michael.

## 3. Archivos
Tabla aprobada en spec 31. Helpers adicionales necesarios: `cases/orderChanges.ts`, `scheduleProtection.ts`, `caseFixture.ts`, `queries.test.ts`; integraciones `staff/schedule.ts`, `scheduleFixture.ts`, `staff.test.ts`, `lib/notify.ts`. Separan transacciones y cobertura de permisos para conservar fuentes ≤150 líneas; sin dependencias nuevas.

## 4. Lógica
- Mutaciones de casos/citas, aceptación y cancelación comparten advisory transaction lock 300030 con turnos/horarios/sedes y auditan antes del commit. Avisos después del commit.
- Slots de 15 minutos en America/Lima; cuenta tres días hábiles siguientes, sábado abierto sí, domingos/feriados no. Reprogramación conserva plazo original; si no hay franjas el Técnico revisa el caso.
- Una reprogramación por caso y tipo tras NO_SHOW. Reasignación no borra historial ni permite saltar el límite. Recepción exige custodio asignado, foto JPG/PNG propia existente en almacenamiento local o S3 y nota 5–500, durante cita DROP_OFF vigente.
- Custodia conserva sede para PICKUP. Participantes solo leen sus citas, nombre del trabajador, sede/punto, foto/nota y precio. Trabajador gestiona propios y toma casos sin asignar; Técnico asigna.
- No eliminar turnos con citas futuras ni invalidarlos al editar; no crear feriado sobre citas futuras; no dar de baja custodio con caso activo o cita futura. Cancelación antes de custodia cierra caso/citas y libera RESERVED; después exige retorno asistido.
- `/pay`, `/confirm-payment`, `/confirm-receipt` y pasarela bloquean TODO bazar; webhook aprobado de bazar nunca avanza estado. PDF mantiene flujo actual.

## 5. Criterios
A1 tipos, A2 lint y presupuesto cero de `any`, A3 suite completa y ≥25 nuevos, A4 docs/negativa/enums, A5 fuentes≤150, A7 móvil375 sin scroll, A8 JS inicial<170KB gzip y Equipo<25KB, A10 axe formularios, A11a/c caso físico/concurrencia/permisos y A11d PDF. Ver spec padre para casos concretos.

## 6. Checklist
- [x] Modelo/migración/shared/API y flujo físico hasta PICKUP_SCHEDULED.
- [x] Equipo, Pedidos, Ventas y Checkout con instrucciones/cita y sin pago web bazar.
- [x] Tests/contratos/gates completos y revisión dev de god.

## 7. Evidencia
- SQL aditivo `20261008211600_casos_entrega` aplicado en dev por god; cliente regenerado (mensaje 2026-10-08T21-24-05-568Z-73493a). Sin backfill ni cambios a los dos índices crudos previos.
- Local: API249 sin prueba `access.test.ts` que abre puerto restringido; web80; shared65. Tipos raíz verdes. Nuevos API78/shared13 (91 nuevos). La suite completa queda a god fuera del sandbox.
- docs:check79 rutas; negativa virtual de receive devuelve exit1 y ruta faltante sin alterar OpenAPI real. Scanner ahora cubre también módulos auth/documents/orders anteriormente omitidos.
- Build raíz verde; JS inicial entrada+preloads164.28KB gzip; CSS9.36KB separado; Equipo8.42KB gzip. No nuevas dependencias. Presupuesto `any` cero; tamaño máximo de fuente tocada Checkout149 según checker.
- Pendiente de confirmación: A3 completa, A7, A10, A11a/c/d en dev. Pedido a god por outbox `31a-dev-gates.json`. Ningún gate pendiente se marca aprobado.

- E2E god 2026-10-08T21-38-43-186Z-b83589: aceptación/caso, pago web bloqueado, permisos, carreras toma/cita, turno, recepción con evidencia/hora/custodio, PICKUP y aviso completo, foto en Pedidos, Checkout sin QR, NO_SHOW/reprogramación límite; Equipo/Pedidos/Checkout a375 sin scroll y axe OK. God pidió cuatro ajustes: cancelación del trato por equipo antes de custodia (implementada con transacción/auditoría/avisos a ambas partes y ocho tests), aviso sin ruta cruda de foto, instrucciones físicas en Pedidos/Ventas y región digital de Ventas enfocable. Revisión final de estos ajustes pendiente.

Cierre de god: commit local383fde1 (sin push), Kelly APTO x2 y E2E/gates aprobados; suite404 registrada en memoria de god. La ejecución31b se autorizó por mensaje c6938d.
