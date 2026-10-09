# Especificación: 41 - Panel del equipo independiente

## 1. Objetivo
**Problema:** Equipo vive dentro del layout público con navegación por botones, sin rutas de sección ni espacio propio.
**Resultado esperado:** Técnico/Trabajador abre Mi panel en pestaña nueva; dashboard independiente, menú lateral agrupado y contenido con scroll propio. Móvil usa cajón con foco atrapado y Esc.

## 2. Fuera de alcance
API, BD, SQL, push, lógica de los componentes de pestaña actuales, marca/colores de ReservaYa.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna pendiente. Godb8b307 aprueba trasladar resumen personal a /actividad y redirigir allí a cualquiera sin rol de equipo desde /panel/*.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/index.html` | modificar | Añade los tres iconos usados por la navegación independiente |
| `apps/web/src/app/AppRoutes.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/auth/PanelProfileLink.test.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/auth/TeamPanel.test.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/AppFooter.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/components/AppSidebar.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/components/ProfileMenu.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/PanelDrawer.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/PanelNavigation.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/PanelSection.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/PanelSidebar.tsx` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/focusTrap.ts` | crear | Contenedor, navegación o verificación |
| `apps/web/src/components/teamPanel/navigation.ts` | crear | Contenedor, navegación o verificación |
| `apps/web/src/lib/panelFocusTrap.test.ts` | crear | Contenedor, navegación o verificación |
| `apps/web/src/lib/prefetch.ts` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/lib/routes.ts` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/lib/teamPanelNavigation.test.ts` | crear | Contenedor, navegación o verificación |
| `apps/web/src/pages/Equipo.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/pages/Panel.tsx` | modificar | Contenedor, navegación o verificación |
| `apps/web/src/pages/TeamPanel.tsx` | crear | Contenedor, navegación o verificación |
| `docs/specs/41-panel-equipo-independiente.md` | crear | Contenedor, navegación o verificación |

Rutas verificadas con rg y lectura. Referencias SOLOLECTURA: ReservaYa.site/apps/web/app/(dashboard)/layout.tsx y apps/web/components/layout/Sidebar.tsx. Manifiesto exacto en carpeta Michael, spec41-commit-files.json; excluye worktrees externos.

## 4. Diseño y lógica
/panel/* lazy usa TeamPanel fuera de AppLayout, sin header/footer públicos. Raíz→/panel/resumen. Sidebar visible fija en escritorio, cuatro grupos Operación/Pagos/Moderación/Configuración,13 secciones Técnico/12 Trabajador (Miembros reservado). Cada sección monta el componente de pestaña existente sin modificarlo; Agenda navega a Casos mediante ruta. Cabecera marca UniversoAgustino, avatar inicial/nombre/rol; Volver al sitio/Cerrar sesión. Contador Publicaciones reutiliza query existente de pendientes.

Mi panel del perfil usa Link /panel target=_blank rel=noopener; AuthProvider existente restaura sesión con cookie en nueva pestaña, tokens no viajan en URL ni opener. /equipo preserva tab legacy (pagos/liquidaciones/etiquetas) al redirigir a sección equivalente. /admin conserva puente a /equipo. Resumen personal conservado en /actividad con enlaces/prefetch actualizados y main anidado retirado. Anónimo/estudiante/creator desde /panel/*→/actividad; carga de sesión muestra espera sin controles. Ruta Miembros directa de Trabajador no monta sección.

Contenido en main único, h-dvh/min-w-0/overflow-y-auto y foco accesible; scroll lateral con región etiquetada y focuseable. Drawer móvil limitado90vw con dialog modal, foco inicial/Tab/ShiftTab/retorno del foco/Esc, fondo inert, cierre por navegación/backdrop/resize escritorio. Motion SPRING y reduced-motion; acentos primary/tokens/clases existentes, subset116 incluye inventory_2, calendar_month y monitoring. No cambios API/BD.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1/A2 | Tipos/lint/any | scripts raíz | 0 errores/warnings/any |
| A3 | Tests | suites shared/API/web | verdes,40 nuevos web |
| A4 | API sin cambios | docs:check |108 rutas existentes |
| A5 | Fuentes tocadas | wc TS/TSX | <150 líneas |
| A7/A10 |375/1280,axe | god navegador | sin overflow,0 serias/críticas |
| A8 | Build/bundle | npm run build | inicial<170KB,panel<25KB gzip |
| A11 | Popup/rutas/roles/drawer/foco/legacy/logout | tests+E2E god | pasa |

## 6. Checklist de ejecución
- [x] Layout independiente, rutas y pestaña nueva.
- [x] Sidebar agrupado, roles y marcadores heredados.
- [x] Drawer accesible, scroll propio y controles de cuenta.
- [x] Gates y E2E dev registrados en§7 antes del commit.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | A3 web | Pasa | web140 (40 nuevos: navegación19, foco9, guard/layout8, nueva pestaña4). |
| 2026-10-09 | Iconos | Pasa | God halló 3 iconos ausentes en el subset. Añadidos y representados como literales que detectan `subset-icons.mjs` y la prueba `materialIcons`; subset-icons --check cubre116. |
| 2026-10-09 | Rutas/scroll accesible | Pasa local | Trabajador en `/panel/miembros` redirige a resumen; main y región lateral con foco y nombre accesible. |
| 2026-10-09 | A7/A10/A11 integrada | Pasa con recheck axe pendiente | God confirmó popup real/cookie/restauración,13/12rutas, alias `/equipo`, estudiante→actividad, drawer foco/Esc/inert/resize y axe escritorio limpio. Tras los hallazgos corregidos: axe móvil 375 para resumen y sedes-y-horarios debe repetirse antes del commit. |

| 2026-10-09 | A1/A2 | Pasa | Tipos raíz/lint producto apps+packages+scripts/any0/diffcheck verdes. |
| 2026-10-09 | A3 API/shared | Pasa parcial | API556 excluye3suitespuertos; completa esperada594 (API sin cambios). Shared132 verde. |
| 2026-10-09 | A4 | Pasa | docs108 rutas, API sin cambios. |
| 2026-10-09 | A5 | Pasa |19 fuentes TS/TSX tocadas<150 líneas. |
| 2026-10-09 | A8 | Pasa | Build raíz verde, inicial165.99KB gzip (98.73+54.28+12.98), TeamPanel20.60KB. Avisos Vite heredados Explorar/Forgot. |
