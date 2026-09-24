# Especificación: NN - <Título corto>

> Copia este archivo como `NN-slug.md`. Una spec = un objetivo. Si necesitas "fases", son varias specs.

## 1. Objetivo
**Problema:** qué falla hoy o qué falta (con archivo y líneas si aplica).
**Resultado esperado:** qué podrá hacer el usuario o qué garantiza el sistema al terminar, en 1–3 frases.

## 2. Fuera de alcance
Lo que el agente **no** debe tocar aunque parezca relacionado. Ejemplos:
- Textos legales, de cobro o de comisión (requieren aprobación explícita).
- Eliminar páginas, rutas o funcionalidades existentes.
- Migraciones Prisma no listadas en §3.
- Refactors fuera de los archivos de §3.

**Decisiones de producto que requieren aprobación antes de ejecutar:** (lista o "ninguna").

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/...` | crear / modificar / eliminar | … |
| `apps/api/src/...` | … | … |
| `apps/api/docs/openapi.yaml` | modificar | si cambia un endpoint (gate `docs:check`) |

Rutas verificadas con `ls`/`grep` antes de redactar. Nada de "o equivalente".

## 4. Diseño y lógica
- **UI:** clases del sistema (`docs/specs/13-design-system-rudo.md`): `.btn-*`, `.card*`, `.input`, `.chip`; acentos solo con `primary`/`primary-soft`/`primary-ink`; motion solo con `SPRING` de `lib/motion.ts`.
- **API:** endpoints, contrato `{ data }` / `{ error: { code, message } }`, códigos nuevos.
- **Datos:** modelos y migraciones (nueva, fechada; nunca editar una aplicada).
- **Invariantes:** comisión solo vía `computePrice()` + `PLATFORM_FEE_PCT`; transiciones de pedido solo vía `canTransition`.

## 5. Criterios de aceptación (medibles)
Cada criterio debe poder comprobarse con un comando o una medición. Borra los que no apliquen.

| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | todos en verde; +N tests nuevos: `<archivo.test.ts>` › `<caso>` |
| A4 | Contrato API | `npm run docs:check` | en verde |
| A5 | Tamaño de componentes | ningún `.ts/.tsx` tocado > 150 líneas (`wc -l`) | ≤ 150 |
| A6 | CLS | Playwright/Lighthouse en `<rutas>` a 1280 px y 375 px | < 0.05 |
| A7 | Scroll horizontal | `document.documentElement.scrollWidth <= innerWidth` a 375 px | 0 px de exceso |
| A8 | Bundle | `npm run build` → JS inicial (gzip) | < 170 KB; chunk nuevo < N KB |
| A9 | LCP | Lighthouse móvil 4G simulado | < 2.0 s |
| A10 | Accesibilidad | axe (`scripts/f0-axe.mjs`) en `<rutas>` | 0 violaciones serias/críticas |
| A11 | Comportamiento | caso E2E: "<pasos> → <resultado observable>" | pasa |

## 6. Checklist de ejecución
*(Marca `[x]` solo cuando la tarea esté hecha **y** A1–A3 estén en verde.)*

- [ ] Tarea 1: …
- [ ] Tarea 2: …
- [ ] Tarea N: Verificar A1–A11 aplicables y anotar resultados en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| AAAA-MM-DD | A1 | ✅ / ❌ | … |
