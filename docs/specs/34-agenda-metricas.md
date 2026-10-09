# Especificación 34 - Agenda semanal y métricas del panel

Fuente: RFC 0002 §5 (Agenda, Hoy) y §7. Estado: **aprobada por god (2026-10-08T22-02-14: 34-A, 34-B); implementada**. Sin migración.

## 1. Objetivo
**Problema:** el equipo solo ve casos como lista (`CasesTab`) y `ResumenTab` solo cuenta denuncias; no hay vista semanal de quién recibe, quién tiene qué ni cuántos tratos hay por estado.
**Resultado esperado:** pestaña **Agenda** con semana lunes–sábado × franjas de 15 min, filtros por sede y trabajador, citas coloreadas por tipo/estado, y **Resumen** con métricas (citas de hoy, casos por estado, objetos en custodia por trabajador, faltas del mes, pendientes de revisión).

## 2. Fuera de alcance
- Crear/mover citas arrastrando (reservar sigue en la ficha del caso, spec 31); exportar a calendario externo; domingos.
- Migraciones y modelos nuevos; métricas históricas de ingresos (no hay dinero en el equipo).
**Decisiones que requieren aprobación:** D-A: el Trabajador ve la agenda de **todos** (solo lectura; sin datos personales más allá de nombre, sede, tipo y producto) para coordinar; el Técnico ve igual. D-B: la semana se identifica por `?week=YYYY-MM-DD` (cualquier fecha; se normaliza al lunes en America/Lima), por defecto la actual.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/agenda.ts`, `agenda.test.ts`, `index.ts` | crear/modificar | `AgendaQuerySchema`, tipos de respuesta |
| `apps/api/src/modules/agenda/week.ts`, `metrics.ts`, `routes.ts`, `agenda.test.ts` | crear | consultas de solo lectura (`agendaRouter`, `metricsRouter`) |
| `scripts/docs-check.mjs` | modificar | registrar `agenda/routes.ts` |
| `apps/api/src/modules/staff/routes.ts` | modificar | montar `/agenda`, `/metrics` |
| `apps/api/docs/openapi.yaml` | modificar | 2 rutas |
| `apps/web/src/components/equipo/AgendaTab.tsx`, `AgendaGrid.tsx`, `AgendaFilters.tsx`, `agendaTypes.ts` | crear | semana, filtros, celdas |
| `apps/web/src/components/equipo/ResumenTab.tsx`, `MetricCards.tsx` | modificar/crear | métricas (Resumen conserva la tarjeta de denuncias) |
| `apps/web/src/pages/Equipo.tsx` | modificar | pestaña Agenda; Resumen con métricas |

## 4. Diseño y lógica
- **API (solo equipo):** `GET /api/v1/staff/agenda?week=&sedeId=&staffId=` devuelve `{data:{weekStart, days:[{date,weekday,open,opens,closes,holiday}], staff:[{id,name}], appointments:[{id,caseId,kind,status,startsAt,endsAt,sede,staff,party,itemTitle}], shifts:[{userId,sedeId,weekday,startsMin,endsMin}]}}`. Un rango por semana (≤ 6 días × 1 query de citas con índice `staffId,status,startsAt`), tope 500 citas. `GET /api/v1/staff/metrics` → `{todayAppointments, casesByStatus, custodyByStaff:[{staffId,name,count}], noShowsThisMonth, pendingReviews, openReports}`; las cuentas de custodia = casos `IN_CUSTODY|PICKUP_SCHEDULED|RENTED_OUT|RETURN_SCHEDULED|RETURNED|BACK_TO_SELLER` por `assigneeId`. Todo en America/Lima (reusa `cases/calendar.ts`). Sin escrituras.
- **UI:** grilla 6 columnas (lun–sáb, domingo omitido) × filas de 15 min dentro del horario hábil del día; días cerrados/feriados atenuados con texto "Cerrado"; turnos como fondo `primary-soft`; citas como botones (tipo+estado con texto, no solo color) que abren la ficha del caso; móvil a 375 px: una columna por día con scroll vertical, sin scroll horizontal. Filtros `<select>` por sede y trabajador, flechas semana anterior/siguiente + "Hoy". Altura de grilla reservada. `SPRING` solo en transiciones. Componentes <150 líneas.
- **Invariantes:** no toca citas, dinero ni `canTransition`.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 |
| A2 | Lint + any | lint `--ignore-pattern 'hive/**'` y `any-budget --check` | 0 / 0 |
| A3 | Tests | `npm test` | verde; ≥12 nuevos: normaliza semana al lunes Lima, domingo excluido, filtros sede/trabajador, feriado y día cerrado marcados, canceladas incluidas con estado, solo equipo (estudiante 403), métricas por estado y por custodio, faltas del mes |
| A4 | Contrato | `npm run docs:check` | 2 rutas |
| A5 | Tamaño | `wc -l` | ≤150 |
| A7 | Móvil | Agenda a 375 px | 0 px de exceso |
| A8 | Bundle | `npm run build` | JS inicial <170 KB gzip; Equipo sin crecer >10 KB |
| A10 | a11y | axe en Agenda | 0 serias |
| A11 | E2E dev | cita creada en 31 aparece en su celda con sede y trabajador; filtro por trabajador oculta las demás | pasa |

## 6. Checklist
- [x] Contratos shared
- [x] Endpoints agenda y métricas
- [x] UI Agenda + métricas
- [x] Gates A1–A5 y A8; verificación integrada de god; evidencia en §7

- [x] Agenda/métricas en dev, móvil y auditoría Kelly APTO confirmados por god
- [x] Corrección ARIA de escritorio implementada y estructura comprobada
- [ ] A10 escritorio: repetir axe a 1280 px en entorno que permita Chrome

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1 | ✅ | tsc api+web (alias al shared/Prisma del worktree) |
| 2026-10-08 | A2 | ✅ | lint `--ignore-pattern 'worktrees/**' 'hive/**'` 0/0; `any-budget --check` 0 <= 0 |
| 2026-10-08 | A3 | ✅ | API 366 verdes (+11 en `agenda.test.ts`: semana→lunes Lima, domingo excluido, feriado/día cerrado, filtros, estados incluidos, tope 500, métricas, 401/403/400), shared 83 verdes (+4 `agenda.test.ts`) |
| 2026-10-08 | A4 | ✅ | `docs:check` 94 rutas (+`/staff/agenda`, `/staff/metrics`) |
| 2026-10-08 | A5 | ✅ | AgendaGrid 37, AgendaTab 25, AgendaFilters 20, MetricCards 26, week.ts 37, metrics.ts 28, Equipo.tsx 46 líneas |
| 2026-10-08 | A1–A4, suite integrada | ✅ | god en main `84c0f8e`: typecheck 0 errores; API 366, web 80, shared 83 tests verdes; lint 0; docs:check 94 rutas; any-budget 0. Sustituye las salvedades de shared/Prisma del worktree en el registro inicial. |
| 2026-10-08 | A7, A11; auditoría | ✅ | god: agenda 200 con semana normalizada al lunes y sin correos; métricas 200; estudiante 403; semana inválida 400; agenda/métricas E2E OK; a 375 px exceso 0 px y axe OK; Kelly APTO confirmado en despacho de reanudación. |
| 2026-10-08 | A1, A2, A3, A4, A5, A8; corrección local | ✅ | Michael: typecheck 0; lint con `--ignore-pattern 'hive/**' --ignore-pattern 'worktrees/**'` 0; any-budget 0; web 80 tests; build raíz exit 0; docs:check 94; diff --check 0. AgendaGrid 47 líneas. JS inicial 164.98 KB gzip (<170); Equipo 13.88 KB gzip, incremento 3.93 KB sobre 31 (9.95 KB), <10 KB. |
| 2026-10-08 | A10 escritorio | implementado; axe pendiente | `AgendaGrid.tsx`: tabla ARIA → filas por franja visual → celdas/encabezados, índices y spans; fondos decorativos ocultos al árbol accesible. Se conserva CSS Grid y sus coordenadas. Comprobación estática: 41 filas válidas tanto con 3 citas (2 en la misma franja) como con agenda vacía. Chrome bloqueado por sandbox (`setsockopt: Operation not permitted`, SIGTRAP); no se afirma axe aprobado a 1280 px. Fixture y comprobador en `hive/agents/michael-mv0avixd/agenda-fixture.html` y `verify-agenda.tsx` para repetir medición. |
| 2026-10-09 | A7, A10 (re-medición) | Pasa | God, navegador real contra BD dev: `/equipo` Resumen y Agenda a 375 px y 1280 px con 0 px de exceso y axe sin violaciones serias/críticas tras el arreglo ARIA de AgendaGrid. |
