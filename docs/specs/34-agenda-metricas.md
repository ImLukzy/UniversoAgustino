# Especificación 34 - Agenda semanal y métricas del panel

Fuente: RFC 0002 §5 (Agenda, Hoy) y §7. Estado: **borrador §1–§5 para aprobación de god**. Sin migración.

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
| `apps/api/src/modules/agenda/week.ts`, `metrics.ts`, `routes.ts`, `agenda.test.ts` | crear | consultas de solo lectura |
| `apps/api/src/modules/staff/routes.ts` | modificar | montar `/agenda`, `/metrics` |
| `apps/api/docs/openapi.yaml` | modificar | 2 rutas |
| `apps/web/src/components/equipo/AgendaTab.tsx`, `AgendaGrid.tsx`, `AgendaFilters.tsx`, `agendaTypes.ts` | crear | semana, filtros, celdas |
| `apps/web/src/components/equipo/ResumenTab.tsx`, `MetricCards.tsx` | modificar/crear | métricas |
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
- [ ] Contratos shared
- [ ] Endpoints agenda y métricas
- [ ] UI Agenda + métricas
- [ ] Gates A1–A5, registrar §7

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
