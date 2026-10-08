# Especificación: 28 - "Mi panel" en el perfil, etiquetas de rol y centro de notificaciones

Diseño: `docs/rfc/0002-entregas-mediadas-equipo.md` §5–§6 (D4, D5).

## 1. Objetivo
**Problema:** el equipo solo llega a `/equipo` escribiendo la URL o desde el Panel; los roles se muestran como `admin`/`moderator`; las notificaciones son una lista plana; el pie muestra "Iniciar sesión / Crear cuenta" aunque haya sesión (`AppFooter.tsx:10,33`).
**Resultado esperado:** al tocar el avatar, técnico y trabajadores ven **Mi panel** → `/equipo`. Los roles se leen "Técnico" y "Trabajador". Las notificaciones tienen contador visible, filtros (Todas / No leídas / Pedidos / Publicaciones / Equipo), agrupación por día, "Marcar todo leído" y abren su enlace marcándose leídas. El pie no ofrece login a quien ya tiene sesión.

## 2. Fuera de alcance
- Nuevos tipos de notificación del flujo de entregas (specs 29–33) y correo.
- Migraciones: ninguna.

**Decisiones que requieren aprobación:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/components/…/ProfileMenu.tsx:57-111` | modificar | ítem "Mi panel" (icono existente del subset) solo `admin|moderator`, primero de la lista |
| `apps/web/src/lib/roles.ts:2-3` | modificar | `admin`→"Técnico", `moderator`→"Trabajador" |
| `apps/web/src/components/equipo/MiembrosTab.tsx:43` | modificar | usar `roleLabel` |
| `apps/web/src/pages/Notificaciones.tsx` (+ `components/notificaciones/*`) | modificar / crear | filtros por categoría, grupos Hoy/Ayer/Esta semana/Antes, "Marcar todo leído", estado vacío por filtro, paginación "Ver más" |
| `apps/api/src/modules/notifications/routes.ts:9-28` | modificar | filtro `?category=orders|publications|team` (mapa tipo→categoría en `packages/shared`) |
| `packages/shared/src/` | modificar | `NOTIFICATION_CATEGORY` (tipo → categoría) + test |
| `apps/web/src/components/…/AppFooter.tsx:10,33` | modificar | con sesión: "Mi cuenta" y "Cerrar sesión" en vez de "Iniciar sesión / Crear cuenta" |
| `apps/api/docs/openapi.yaml` | modificar | parámetro `category` |

## 4. Diseño
- Contador: reutiliza `ProfileMenu.tsx:19-26` (no duplicar polling). El badge también se ve en el ítem "Notificaciones".
- Filtro por categoría en API (no en cliente) para que la paginación sea correcta.
- Accesible: filtros como `role="tablist"`; ítems no leídos con texto "No leída" para lectores de pantalla.

## 5. Criterios de aceptación
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1–A4 | typecheck · lint · test · docs:check | gates | verdes; tests: categoría filtra en API; mapa cubre todos los `NotificationType` |
| A5 | Tamaño | ≤ 150 líneas (exento openapi) | ≤ 150 |
| A7 | Scroll | `/notificaciones` y menú a 375 px | 0 px |
| A11 | E2E (god) | trabajador ve "Mi panel" y entra; estudiante no lo ve; filtro "No leídas" y "Marcar todo leído" funcionan; footer con sesión no muestra "Iniciar sesión" | pasa |

## 6. Checklist
- [ ] Menú + etiquetas · [ ] API categoría + shared · [ ] Página de notificaciones · [ ] Footer · [ ] Gates y §7

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
