# Especificación: 12 - SEO y Rendimiento

## 1. Objetivo y Contexto
**Descripción:** La web (Vite 5 + React Router) ya hace code-splitting por página y carga `pdfjs-dist` en lazy, con el worker como chunk aparte. Aun así, faltan presupuestos medibles, metadatos por ruta y garantías de LCP/CLS en el Home nuevo (`StudocuHero` + `HomeRecentDocs`).
**Objetivo técnico:** Fijar los presupuestos (LCP < 2.0 s en 4G simulado, CLS < 0.05, JS inicial < 170 KB gzip), metadatos SEO por ruta y carga diferida de miniaturas PDF.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **LCP del Home:** el elemento LCP es el `h1` del Hero (texto, no imagen). Fuentes con `font-display: swap` y `preload` de la fuente del titular.
- **Motion vs. LCP:** el fade-in-up inicial no debe partir de `opacity: 0` en el `h1`. Se usa `initial={false}` o un desplazamiento en y sin tocar la opacidad, para no retrasar el LCP.
- **Tema sin flash:** `--hub-p` se fija antes del primer paint (spec 05, Tarea 5). El color de la carrera no debe provocar repaint ni shift.
- **CLS:**
  - Skeletons con geometría 1:1, `aspect-ratio` fijo en covers y fotos del bazar, alto reservado para la fila "Del Bazar" y el paywall.
  - Los iconos del subset de Material Symbols se cargan con `font-display: block` y tamaño fijo.
- **Miniaturas PDF:** `PagePreview` renderiza solo cuando la card entra en el viewport (IntersectionObserver, `rootMargin: 200px`), con un placeholder `bg-zinc-100` del mismo tamaño.

## 3. Arquitectura y Lógica de Negocio
- **Code-splitting:**
  - Verificar que todas las rutas de `App.tsx` usan `lazy()`.
  - `manualChunks` en `vite.config` para `react-vendor`, `motion` y `query`. `pdfjs` nunca entra en el chunk inicial.
- **Prefetch:** hover/focus sobre una `DocumentCard` precarga el chunk de `Visor` y la query `GET /documents/:id` (`queryClient.prefetchQuery`).
- **API y caché:**
  - `GET /documents` y `GET /bazar` responden con `Cache-Control: private, max-age=30` y ETag.
  - Las miniaturas vienen de `/uploads/:name?stream=1` con `Range` (solo página 1). La 302 a R2 sigue sin caché (firmas de 15 min).
- **SEO:**
  - Hook `useDocumentMeta({ title, description, canonical })` por ruta, sin dependencias nuevas.
  - `/v/:id` con `og:title`/`og:description` del documento, **sin** exponer páginas de pago.
  - `robots.txt` y `sitemap.xml` estáticos para las rutas públicas (`/`, `/bazar`, `/legal`).
- **Medición:**
  - Script `npm run perf` con Lighthouse CI sobre `vite preview` (Home y Visor), con umbrales que fallan el build.
  - Reporte de `web-vitals` en consola solo en dev.

## 4. Checklist de Ejecución
- [ ] Tarea 1: Auditar `App.tsx` (todas las rutas en `lazy()`) y añadir `manualChunks` en `vite.config`; verificar que `pdfjs` no está en el chunk inicial.
- [ ] Tarea 2: Carga diferida de `PagePreview` con IntersectionObserver y un placeholder de tamaño idéntico.
- [ ] Tarea 3: Ajustar el motion del Hero para no retrasar el LCP (`h1` visible desde el primer paint); preload de la fuente del titular.
- [ ] Tarea 4: Crear `useDocumentMeta` y aplicarlo en Home, Bazar, Visor y Legal; añadir `robots.txt` y `sitemap.xml`.
- [ ] Tarea 5: Prefetch del chunk del Visor y de `GET /documents/:id` al hacer hover en la card; `Cache-Control` + ETag en los listados (documentar en `openapi.yaml`).
- [ ] Tarea 6: Añadir el script `npm run perf` (Lighthouse CI) con LCP < 2.0 s, CLS < 0.05 y JS inicial < 170 KB gzip, y verificar que el Home pasa.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Sin tareas completas.**
- **Tarea 1, parcial.**
  - Hay `manualChunks` en `vite.config.ts` (`vendor-react`, `vendor-query`, `vendor-pdf`), pero no el chunk `motion`.
  - `AppRoutes.tsx` importa sin `lazy()` `Explorar` y `Forgot`.
  - No está verificado con un build que `pdfjs` quede fuera del chunk inicial.
- **Tarea 2, parcial.** `PagePreview` se carga con `lazy()` desde `DocumentCard`, pero `PdfPreview.tsx` no usa IntersectionObserver (solo `viewer/PdfPages.tsx` lo usa).
- **Tarea 3, sin hacer.** El `h1` de `StudocuHero` arranca con `opacity: 0` y no hay `preload` de la fuente en `index.html`.
- **Tarea 4, sin hacer.** No existen `useDocumentMeta`, `robots.txt` ni `sitemap.xml`.
- **Tarea 5, parcial.** Solo hay prefetch de chunks de ruta en `AppSidebar` (`onMouseEnter`), no en `DocumentCard`. No hay `Cache-Control`/ETag en los listados.
- **Tarea 6, sin hacer.** `lighthouse` está en devDependencies de la raíz, pero no existe el script `npm run perf`.
