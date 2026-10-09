# Especificación: 44 - Pulido del panel del equipo

## 1. Objetivo
**Problema:** el panel `/panel/*` (spec 41) se ve desordenado: "Usuarios" muestra la palabra GROUP porque `group` (y `manage_accounts`) faltaban en el subset de Material Symbols (`navigation.ts` no lo escaneaba `scripts/subset-icons.mjs`); la cabecera y la sección repiten el título (Ganancias, Pagos por verificar, Pagos a vendedores, Completas, Cuentas de cobro, Publicaciones, Sedes, Denuncias con un `h1` propio, Resumen con "Denuncias abiertas" dos veces); el menú a 1280×900 se corta; en móvil el botón de menú flota solo; huecos por `min-h-*` en mensajes vacíos y "Cargando…" sin altura.
**Resultado esperado:** un título por sección (cabecera con grupo, título y descripción), menú compacto con scroll propio y pie fijo, barra superior móvil (menú + logo + título) y cargas con skeleton de alto reservado.

## 2. Fuera de alcance
API, BD, landing, `ProfileMenu`/`AppLayout`, lógica de las pestañas. **Decisiones de producto que requieren aprobación:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/subset-icons.mjs` | modificar | escanea `icon:` de `components/teamPanel/navigation.ts` |
| `apps/web/index.html` | modificar | subset regenerado (118 iconos, +group, +manage_accounts) |
| `apps/web/src/pages/TeamPanel.tsx` | modificar | cabecera grupo/título/descripción, barra superior móvil |
| `apps/web/src/components/teamPanel/navigation.ts` | modificar | `description` por sección |
| `apps/web/src/components/teamPanel/PanelNavigation.tsx` | modificar | ítems compactos, icono sin ternario |
| `apps/web/src/components/teamPanel/PanelSidebar.tsx` | modificar | cabecera/pie compactos, scroll visible |
| `apps/web/src/components/teamPanel/PanelLoading.tsx` | crear | skeleton con alto reservado |
| `apps/web/src/components/teamPanel/PanelTopBar.tsx` | crear | barra superior móvil |
| `apps/web/src/components/equipo/{Agenda,Cases,Denuncias,Earnings,Miembros,PaymentAccounts,Payments,Payouts,Publicaciones,Sedes,Usuarios}Tab.tsx`, `MetricCards.tsx`, `ResumenTab.tsx` | modificar | sin títulos duplicados, skeletons, mensajes sin hueco |
| `apps/web/src/lib/panelPolish.test.ts` | crear | iconos en subset, descripciones únicas |
| `docs/specs/44-panel-pulido.md` | crear | esta spec |

## 4. Diseño y lógica
- Cabecera de contenido: eyebrow = grupo, `h1` = sección (solo `sr-only` en móvil, donde el título va en la barra superior), descripción en `text-zinc-600`. Las pestañas ya no pintan `h2` con el mismo nombre; `Denuncias` pierde su `h1` y contenedor de página; `Resumen` quita la tarjeta duplicada "Denuncias abiertas" (ya está en `MetricCards`).
- Menú: ítems `lg:min-h-9`, grupos `gap-3`; región central `overflow-y-auto` con scrollbar fino visible; "Volver al sitio" y "Cerrar sesión" fijos (`shrink-0`).
- Móvil: `PanelTopBar` (h-14, `lg:hidden`) fuera del `main`; el contenido ya no reserva `pt-20`.
- Cargas: `PanelLoading` (`role="status"`, `aria-busy`, `minHeight = filas×112`); mensajes de estado `sr-only` cuando están vacíos (sin `min-h` ni hueco en el `gap`).
- UI: solo tokens `primary*`, clases `.card`; sin motion nuevo.

## 5. Criterios de aceptación
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck -w apps/web` | 0 errores |
| A2 | Lint | `npx eslint apps/web/src --max-warnings=0` | 0 |
| A3 | Tests | `npm test -w apps/web` | verdes; +4 en `panelPolish.test.ts` |
| A5 | Tamaño | `wc -l` de los tocados | ≤ 150 |
| A6 | Iconos | `node scripts/subset-icons.mjs --check` | OK, incluye group/manage_accounts |
| A7 | 375/1280 + CLS | revisión visual de las 13 secciones (god, navegador) | sin overflow, menú completo visible a 1280×900, CLS < 0.05 |

## 6. Checklist de ejecución
- [x] Iconos del panel en el subset (script + `--write`).
- [x] Un solo título por sección (cabecera con descripción; `h2` duplicados retirados).
- [x] Menú compacto con scroll propio y pie fijo.
- [x] Barra superior móvil con menú, logo y título.
- [x] Skeletons con alto reservado y mensajes sin hueco.
- [x] Gates A1–A3, A5, A6 en verde; A7 pendiente de revisión visual por god.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | A1 | ✅ | `npm run typecheck -w apps/web` sin errores |
| 2026-10-09 | A2 | ✅ | `npx eslint apps/web/src --max-warnings=0` sin salida |
| 2026-10-09 | A3 | ✅ | 29 archivos, 147 tests verdes (incl. `panelPolish.test.ts`) |
| 2026-10-09 | A5 | ✅ | máx. 72 líneas en archivos tocados (`wc -l`) |
| 2026-10-09 | A6 | ✅ | `subset-icons --check OK (118 iconos)`; antes fallaba con `group`, `manage_accounts` |
| 2026-10-09 | A7 | ⏳ | no verificado en navegador (sin API/sesión en este entorno); la altura de menú es estimada (~870 px a 1280×900) |
