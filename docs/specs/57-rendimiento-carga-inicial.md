# Especificación: 57 - Rendimiento de la carga inicial (LCP)

## 1. Objetivo
**Problema:** medición en producción 2026-10-13 (Lighthouse móvil 4G, mediana de 3, informe de Jim): LCP ~4.6 s en `/`, `/explorar`, `/inicio` y detalle (objetivo < 2.0 s); CLS 0, TBT 0 y JS inicial 164 KB gzip cumplen. Causas: ~217 KB de fuentes de Google en la ruta crítica (2 conexiones de terceros), consulta de sesión (`/auth/me` + `/auth/refresh`, `oauth/status`) en cada carga de páginas públicas antes de pintar, `ExamenInteractivo` en el chunk crítico de la landing, `framer-motion` en el index, y caché `must-revalidate` en `/assets/*` con hash.
**Resultado esperado:** LCP móvil ≤ 2.5 s en esas páginas (mejor si < 2.0 s), sin empeorar CLS (0) ni accesibilidad, y JS inicial ≤ 170 KB gzip.

## 2. Fuera de alcance
- SSR o pre-render (otro proyecto si tras esto no se llega a < 2.0 s).
- Cambiar diseño visual, tipografías (mismas familias y pesos usados) o textos.
- API y BD (el keep-alive está en la spec 56).

**Decisiones de producto:** aprobadas por el humano 2026-10-13 (mejorar rendimiento).

## 3. Archivos afectados (según el informe; confirmar con grep)
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/index.html`, `apps/web/src/styles/tokens.css`, `apps/web/public/` (o assets) | modificar / crear | fuentes autohospedadas en woff2: Inter latin solo 400/600/700 y Plus Jakarta Sans solo 600/700/800, `font-display: swap`, `preload` de las críticas; iconos Material Symbols autohospedados manteniendo el subset |
| `scripts/subset-icons.mjs` | modificar | que siga generando/verificando el subset con el archivo autohospedado (`--write`/`--check`) |
| `apps/web/src/auth/AuthContext.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/components/auth/OAuthButtons.tsx` | modificar | en páginas públicas, no bloquear el primer render con la sesión: restaurar sesión tras pintar (idle) y `oauth/status` solo al abrir el login; rutas protegidas siguen esperando la sesión como hoy |
| `apps/web/src/components/landing/LandingFeatures.tsx` | modificar | `ExamenInteractivo` con `React.lazy` + `Suspense` (altura reservada, CLS 0) |
| chunk inicial (`framer-motion`) | modificar | sacarlo del index si es posible sin cambiar la animación visible (carga diferida o CSS para el hero) |
| `vercel.json` | modificar | `Cache-Control: public, max-age=31536000, immutable` para `/assets/*` con hash |
| tests en `apps/web/src/**` | crear / modificar | sesión diferida no rompe login ni rutas protegidas |

## 4. Diseño y lógica
- Medir antes/después con el mismo método (Lighthouse móvil 4G, 3 corridas, mediana) sobre un build de producción local (`vite preview` desde `apps/web`) y documentar la tabla.
- Riesgo de la sesión diferida: un usuario con sesión ve unos ms la cabecera de visitante en páginas públicas → mostrar un estado neutro (sin parpadeo) y nunca enviar al usuario al login por ese retraso.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | LCP | Lighthouse móvil 4G, mediana de 3, en `/`, `/explorar`, `/inicio`, detalle (build local de producción) | ≤ 2.5 s |
| A3 | CLS / TBT | igual | CLS < 0.05, TBT sin empeorar |
| A4 | JS inicial | build | ≤ 170 KB gzip |
| A5 | A10 axe | esas páginas a 1280/375 | 0 serias/críticas |
| A6 | E2E | `npm run e2e` | ✓ (sesión, login y panel siguen funcionando) |
| A7 | Iconos | `node scripts/subset-icons.mjs --check` | OK |

## 6. Checklist de ejecución
- [ ] Tarea 1: fuentes e iconos autohospedados.
- [ ] Tarea 2: sesión diferida en páginas públicas.
- [ ] Tarea 3: lazy de ExamenInteractivo y dieta del index; caché de assets.
- [ ] Tarea 4: medir antes/después y verificar A1–A7 (§7).

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
