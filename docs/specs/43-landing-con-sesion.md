# Especificación: 43 - Landing con sesión

## 1. Objetivo
**Problema:** En `/inicio` con sesión la barra superior no muestra el avatar/menú de perfil y el hero queda ~142 px más bajo que el público (sin zona de subida), por lo que el fondo morado se corta bajo el buscador y recorta los adornos.
**Resultado esperado:** La barra de la landing con sesión muestra el `ProfileMenu` (escritorio y móvil) y el hero conserva el alto/espaciado inferior del hero público, con adornos completos.

## 2. Fuera de alcance
- `components/teamPanel/**`, `pages/TeamPanel.tsx` y páginas del panel.
- `ProfileMenu.tsx` (se reutiliza sin cambios), API, BD.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/components/landing/LandingNav.tsx` | modificar | `ProfileMenu` en lugar de "Iniciar sesión" si `withSession` |
| `apps/web/src/components/landing/LandingHero.tsx` | modificar | relleno inferior `pb-32 sm:pb-56` con sesión (iguala el alto público) |
| `apps/web/src/auth/Spec42Landing.test.tsx` | modificar | 2 pruebas de Spec 43 |
| `docs/specs/43-landing-con-sesion.md` | crear | esta spec |

## 4. Diseño y lógica
- **UI:** sin colores nuevos; el avatar usa tokens `primary` ya definidos en `ProfileMenu`. Sin iconos nuevos.
- **Alto:** la zona de subida mide ~142 px a 1280 px; `sm:pb-56` (14 rem) en vez de `pb-20` compensa. Los adornos inferiores van anclados abajo, así que quedan igual que en el hero público.
- **Invariantes:** no se duplica lógica de menú; sin sesión nada cambia.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck -w apps/web` | 0 errores |
| A2 | Lint | `npx eslint apps/web/src --max-warnings=0` | 0 |
| A3 | Tests | `npm test -w apps/web` | verde; +2 en `Spec42Landing.test.tsx` |
| A4 | Iconos | `node scripts/subset-icons.mjs --check` | verde |
| A5 | Tamaño | `wc -l` archivos tocados | ≤ 150 |
| A6 | Visual 1280/375 | captura con sesión vs anónimo | pendiente de verificación en navegador |

## 6. Checklist de ejecución
- [x] ProfileMenu en LandingNav con sesión
- [x] Relleno inferior del hero con sesión
- [x] Pruebas
- [x] Gates A1–A5

## 7. Registro de verificación
| 2026-10-09 | A1 typecheck web | ✅ | 0 errores |
| 2026-10-09 | A2 eslint apps/web/src | ✅ | 0 warnings |
| 2026-10-09 | A3 tests web | ✅ | 145/145 en 28 archivos (+2 Spec 43) |
| 2026-10-09 | A4 iconos | ✅ | `--check` OK |
| 2026-10-09 | A5 tamaño | ✅ | LandingNav 39, LandingHero 40 líneas |
| 2026-10-09 | A6 visual | ⚠️ pendiente | no verificado en navegador; el alto se iguala por cálculo (142 px medidos en capturas) |
