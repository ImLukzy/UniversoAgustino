# Especificación: 30 - Sedes, horario hábil, feriados y turnos

Diseño: RFC 0002 §2 D6–D7, §4 y §5. Aprobada por god el 2026-10-08 con ajustes registrados en esta versión.

## 1. Objetivo
**Problema:** no existen sedes, horarios, feriados ni turnos persistidos. `/pedidos` muestra puntos de entrega hardcodeados desde `careerContent`; `/equipo` carece de administración de horarios.
**Resultado esperado:** el Técnico administra sedes, horario semanal, feriados y turnos; el Trabajador consulta sus turnos. Las sedes activas y sus horarios se consultan públicamente y sustituyen los puntos sugeridos de `/pedidos`. Los turnos quedan dentro del horario de una sede activa y no se solapan para un trabajador, incluso entre sedes.

## 2. Fuera de alcance
- Casos, citas, custodia, pagos, chat, sanciones y agenda de specs 31–34.
- Cambiar pedidos, roles, OAuth, textos de comisión o datos existentes del marketplace.
- Ejecutar migraciones o seed en cualquier BD: god aplica en dev; prod requiere OK humano.
- Ejecutar el seed general `apps/api/prisma/seed.ts`, que elimina datos.

**Decisiones que requieren aprobación:** Aprobadas por god: horario y feriados globales UNSA, zona `America/Lima`; turnos semanales por sede. Dirección y punto de encuentro iniciales vacíos para que el Técnico los complete, sin inventar ubicaciones.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | modelos Sede, OpeningHours, Holiday, StaffShift; relación User.staffShifts |
| `apps/api/prisma/migrations/20261008205300_sedes_horarios/migration.sql` | crear | aditiva: tablas, índices, claves externas y checks; sin aplicar |
| `apps/api/src/modules/sedes/seed.ts`, `seed.test.ts` | crear | lógica de seed idempotente verificable sin BD |
| `apps/api/prisma/seed-sedes.ts` | crear | seed dedicado, transaccional, idempotente y no destructivo; god lo ejecuta |
| `apps/api/package.json` | modificar | comando `prisma:seed-sedes`, independiente del seed general |
| `packages/shared/src/sedes.ts`, `packages/shared/src/sedes.test.ts` | crear | esquemas de sede/horario/feriado/turno y validación de intervalos |
| `packages/shared/src/index.ts` | modificar | exportar contratos |
| `apps/api/src/modules/sedes/routes.ts` | crear | GET público de sedes activas y horarios/feriados |
| `apps/api/src/modules/staff/sedes.ts`, `schedule.ts`, `shifts.ts`, `scheduleGuard.ts` | crear | CRUD protegido, validación y auditoría transaccional |
| `apps/api/src/modules/staff/sedes.test.ts`, `schedule.test.ts`, `shifts.test.ts` | crear | autorización, validación, concurrencia y auditoría sin servicios reales |
| `apps/api/src/modules/staff/routes.ts`, `apps/api/src/app.ts` | modificar | montar administración y lectura pública |
| `apps/api/docs/openapi.yaml` | modificar | todas las rutas y errores nuevos |
| `eslint.config.mjs` | modificar | excepción projectService para runner seed-sedes, autorizada por god |
| `apps/api/src/modules/staff/scheduleFixture.ts` | crear | harness de tests de rutas sin puertos ni BD |
| `scripts/docs-check.mjs` | modificar | reconocer routers modularizados nuevos |
| `apps/web/src/components/equipo/SedesTab.tsx`, `SedeForm.tsx`, `HoursForm.tsx`, `HolidaysForm.tsx`, `ShiftsForm.tsx`, `sedeTypes.ts` | crear | administración y consulta propia de turnos; componentes ≤150 líneas |
| `apps/web/src/pages/Equipo.tsx` | modificar | pestaña Sedes y horarios para ambos roles |
| `apps/web/src/components/orders/DeliverySites.tsx` | crear | sedes activas de API, horario, feriados y estados de carga/error/vacío |
| `apps/web/src/pages/Pedidos.tsx` | modificar | sustituir puntos hardcodeados por DeliverySites |
| `docs/specs/30-sedes-horarios.md` | modificar | checklist y evidencia después de aprobación |

Verificadas rutas actuales de schema, seed, app, staff/routes, Equipo y Pedidos. Los archivos nuevos se crean en los directorios indicados. Excepciones propuestas a A5: schema existente y OpenAPI.

## 4. Diseño y lógica
**Datos:**
- `Sede`: id, name único (1–100), address y meetingPoint (0–300), photoUrl opcional de ruta interna `/uploads/...` (mismo patrón seguro que voucher, sin URLs externas), active=true, createdAt/updatedAt. DELETE equivale a desactivar; no borrar referencias futuras.
- `OpeningHours`: weekday único 0–6 (domingo=0), opens/ closes en minutos locales 0–1440, special boolean. Fila ausente significa cerrado; opens < closes. DELETE cierra ese día.
- `Holiday`: id, date única (`@db.Date`, cadena YYYY-MM-DD validada como fecha real), reason 3–200. Cierre global todo el día local. Sin asignar feriados ficticios.
- `StaffShift`: id, userId→User, sedeId→Sede, weekday 0–6, startsMin/endsMin, createdAt/updatedAt. FK restrict para sede/usuario; índices userId+weekday y sedeId+weekday; checks startsMin < endsMin y rango de minutos.
- Seed: ids estables para Ingenierías, Sociales y Biomédicas; dirección y punto vacíos. Horario L–V 08:00–18:00, S 08:00–13:00 special=true, domingo cerrado. `upsert` con update vacío: no sobrescribir configuraciones posteriores; AuditLog de inserciones con actor null. No crear usuarios ni turnos.

**API:** prefijo existente `/api/v1`, contrato `{data}`/`{error:{code,message}}`.
- Público: `GET /sedes` → solo activas, sin datos de trabajadores; `GET /sedes/schedule` → horario global y feriados desde hoy en America/Lima, ordenados, máximo 60.
- Equipo: `GET /staff/sedes` → todas; `GET /staff/schedule` → horario y feriados; `GET /staff/shifts` → Técnico ve todos, Trabajador solo propios (ignora filtros de otros usuarios).
- Solo Técnico: `POST /staff/sedes`, `PATCH /staff/sedes/:id`, `DELETE /staff/sedes/:id`; `PUT /staff/schedule/hours/:weekday`, `DELETE /staff/schedule/hours/:weekday`; `POST /staff/schedule/holidays`, `DELETE /staff/schedule/holidays/:id`; `POST /staff/shifts`, `PATCH /staff/shifts/:id`, `DELETE /staff/shifts/:id`.
- Cambios y AuditLog en la misma transacción. Edición de horario que invalidaría turnos se rechaza; primero se ajustan/quitan esos turnos. Desactivar sede con turnos vigentes se rechaza para evitar configuraciones inválidas.
- Turno: usuario actual admin/moderator; sede activa; día abierto; intervalo contenido dentro de horario; solape si `inicioA < finB && finA > inicioB`. Turnos contiguos permitidos, solape entre sedes también prohibido, excluyendo el propio id al editar.
- Escrituras de horarios/sedes/turnos toman el mismo bloqueo consultivo **de transacción** PostgreSQL para que comprobar y escribir sea atómico incluso con pooler; no locks entre transacciones. Lecturas no bloquean.
- Errores: 400 VALIDATION; 401/403 según auth; 404 NOT_FOUND; 409 SHIFT_OVERLAP, OUTSIDE_HOURS, DAY_CLOSED, SEDE_INACTIVE, NOT_STAFF, HAS_SHIFTS o duplicado. Auditoría: sede.create/update/deactivate, hours.save/delete, holiday.create/delete, shift.create/update/delete.

**UI:**
- `/equipo` añade Sedes y horarios. Técnico: formularios con labels, mensajes, edición/desactivación y confirmación de borrado; horarios con inputs time, sábado especial visible; feriados con fecha/motivo; turnos con trabajador/sede/día/inicio/fin.
- Trabajador: lectura de sedes/horario y sus turnos, sin controles de escritura ni acceso a turnos ajenos.
- `/pedidos`: listado real de sedes activas, dirección/punto si están configurados (si no, aviso pendiente de coordinación); horario y cierre dominical/feriados. No afirmar disponibilidad de citas ni añadir selección de sede al pedido en esta spec.
- Clases card/input/btn/chip, tokens primary, flex/grid con min-w-0 y salto de línea; errores visibles. Queries por usuario e invalidación después de guardar. No polling nuevo ni librerías adicionales.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | build shared antes de `npm run typecheck`; Prisma regenerado por god | 0 errores |
| A2 | Lint | `npm run lint -- --ignore-pattern 'hive/**'` (exclusión operativa ya aprobada) | 0 errores/warnings |
| A3 | Tests | `npm test` completo por god fuera del sandbox | todos verdes; ≥20 nuevos: esquemas, público sin inactivas/PII, CRUD admin, Trabajador lectura propia, horario/turnos inválidos, solapes entre sedes/contiguos, auditoría, seed idempotente |
| A4 | API | `npm run docs:check`; OpenAPI cubre rutas anteriores | verde; prueba negativa detecta ruta nueva sin documentar |
| A5 | Tamaño | `wc -l` fuentes nuevas/tocadas | ≤150; schema/OpenAPI exentos |
| A7 | Scroll | god mide scrollWidth frente a innerWidth, mismos recorridos | 0 px de exceso a375 |
| A8 | Bundle | `npm run build`, chunks gzip | inicial <170 KB; nuevo chunk <20 KB; sin dependencias nuevas |
| A10 | Accesibilidad | god axe solo en formularios de la pestaña | 0 violaciones serias/críticas; formularios etiquetados |
| A11 | Comportamiento | god migra/seed dev; Técnico edita sede/horario/feriado/turno; Trabajador ve propios; público solo activas; Pedidos usa API | pasa; seed repetido no duplica ni sobrescribe; domingo/feriado cerrados; horario fuera de turno y solape rechazados |

## 6. Checklist de ejecución
- [x] Modelos, migración aditiva y seed dedicado preparados.
- [x] API pública/equipo, permisos, validación y auditoría.
- [x] UI de sedes/horarios/turnos y Pedidos con datos de API.
- [x] Gates y evidencia en §7 (god aplica migración/seed y verifica navegador).

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1/A2 | Verdes | Build shared previo; typecheck raíz 0 errores; lint de producto excluyendo hive 0 errores/warnings |
| 2026-10-08 | A3 local | 46 tests nuevos verdes | API 171/171 excluyendo access.test.ts por puerto restringido; web 80/80; shared 52/52. API nuevos: sedes13 + horario11 + turnos13 + seed3; shared6 |
| 2026-10-08 | A3 completo | Pendiente de god fuera del sandbox | Suite esperada API181/web80/shared52=313; solicitada tras implementación |
| 2026-10-08 | A4 | Verde y prueba negativa confirmada | docs:check 39 rutas; copia temporal del checker detectó /sedes/__docs_missing sin alterar producto |
| 2026-10-08 | A5 | Verde | Fuentes tocadas máximo94 líneas Pedidos.tsx; schema/OpenAPI exentos aprobados |
| 2026-10-08 | A8/build | Verde | npm run build raíz exit0; web762 módulos; JS entrada+modulepreload gzip~162.4KB <170KB; chunk Equipo6.21KB <20KB |
| 2026-10-08 | Iconos/diff | Verde | subset-icons --check113; git diff --check exit0 |
| 2026-10-08 | Migración/seed dev | God confirma aplicados | 20261008205300_sedes_horarios en Unsa, cliente regenerado; seed primero seeded:true, segundo seeded:false; índices crudos previos fuera del alcance |
| 2026-10-08 | A7/A10/A11 | Pendientes de god | Navegador375, axe formularios, CRUD/lectura propia/Pedidos y concurrencia real de turnos entre sedes |

Migración y seed ejecutados exclusivamente por god; Michael no aplicó SQL ni seed. Excepción ESLint para seed-sedes autorizada expresamente por god. Locks de transacción compartidos para cambios de sedes/horarios/turnos; validación y AuditLog dentro de esa transacción. Seed usa marcador para no reabrir días cerrados al repetirlo. Fotos subidas mediante la API existente y persistidas solo como rutas internas. Sin commit/push; checklist pendiente de suite completa y verificaciones de god.
| 2026-10-08 | Migración + seed dev | Pasa (god) | `20261008205300_sedes_horarios` aplicada en Unsa; `prisma:seed-sedes` 1ª {seeded:true}, 2ª {seeded:false}. |
| 2026-10-08 | Suite completa | Pasa | God fuera del sandbox: typecheck 0, lint 0/0, docs:check 39 rutas, secrets OK; tests API 181, web 80, shared 52 (313). |
| 2026-10-08 | A11 | Pasa | God, BD dev: público `/sedes` solo 3 activas con claves id/name/address/meetingPoint/photoUrl (sin PII); técnico edita punto (200), estudiante 403; feriado 201; turno lun 09–12 201, solape 11–13 en otra sede 409, contiguo 12–13 201, domingo 409, sábado 12–14 409, usuario no staff 409, desactivar sede con turnos 409; trabajador ve solo sus 2 turnos y no crea (403); estudiante `/staff/shifts` 403; `/pedidos` lista sedes de la API con el punto editado y sin "Goyeneche". Datos de prueba limpiados. |
| 2026-10-08 | A7, A10 | Pasa | 375 px: `/equipo` Sedes y horarios (técnico y trabajador) y `/pedidos` 0 px de exceso; axe 0 violaciones serias/críticas. |
| 2026-10-08 | Auditoría | Pasa | Kelly APTO sin hallazgos (escritura solo técnico, público sin PII, lock transaccional real, solape entre sedes, photoUrl interno, seed idempotente, AuditLog en la misma transacción). |

| 2026-10-08 | Vista del Trabajador | Ajuste solicitado listo | SedesTab muestra dirección configurada y punto de encuentro por sede, o «Punto por definir»; lint producto y typecheck web exit 0, diff-check limpio |
