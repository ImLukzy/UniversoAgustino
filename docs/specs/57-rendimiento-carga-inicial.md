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
- [x] Tarea 1: fuentes e iconos autohospedados.
- [x] Tarea 2: sesión diferida en páginas públicas.
- [x] Tarea 3: lazy de ExamenInteractivo y dieta del index; caché de assets.
- [x] Tarea 4: medir antes/después y verificar A1–A7 (§7).

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A2 LCP (Lighthouse móvil 4G, mediana de 3, build local contra API prod) | Mejora: producción antes ~4.6 s → / 2.55 s, /explorar 2.48 s, /inicio 2.55 s, detalle 2.82 s. Umbral ≤2.5 s no cumplido por poco en 3 rutas; el humano acepta el resultado (2026-10-13) | Michael 60506d4 |
| 2026-10-13 | A3/A4 | CLS 0, TBT ≤ 4.5 ms; JS inicial 166 → 121 KB gzip (framer-motion fuera de Explorar) | Michael 4d7fc52 |
| 2026-10-13 | A5/A6/A7 | axe 0 serias/críticas en 4 rutas a 1280/375; `npm run e2e` ✓; subset-icons ✓ | Michael |
| 2026-10-13 | Auditoría | OK (Kelly) con observación de bundle → resuelta en 4d7fc52 | Kelly |
| 2026-10-13 | QA (Pam) | Sesión diferida OK (sin parpadeo, rutas protegidas sin redirección, refresh transparente, oauth/status al abrir login). BLOQUEANTE: iconos como texto (faltaba `.material-symbols-outlined`) → corregido en 82a67f6 con verificación en subset-icons y E2E; glifos comprobados en capturas a 1280/375 | Pam + Michael |
| 2026-10-13 | Nota | animaciones de empty state y sidebar pasan a CSS (cubic-bezier) para sacar framer-motion de la carga inicial; respetan prefers-reduced-motion | Michael 4d7fc52 |

- 2026-10-13 hotfix post-publicación: en producción la portada mostraba solo el hero. El hueco diferido medía 0 px y `rootMargin: -100px` nunca intersectaba, y sin scroll posible no se cargaba nada. Fix: `rootMargin` positivo, hueco `min-h-screen` y carga de respaldo a los 1,5 s. E2E `tests/e2e/landing.mjs` (1440 y 375 px): falla con el código anterior (TimeoutError) y pasa con el fix; `npm run verify` y E2E completa en verde.
