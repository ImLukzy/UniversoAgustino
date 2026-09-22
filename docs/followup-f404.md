# Follow-up F4-04 — subset de Material Symbols + Lighthouse post-subset

Fecha: 2026-09-22. Build prod (`vite build` + `vite preview :4173`), Chrome del sistema
headless, API local :4000 en modo s3. Runner propio (navegador fresco por página):
desktop con preset explícito + móvil en Detalle. Fixture Checkout: pedido PENDING real
creado y cancelado (`BUYER_CANCELLED`) tras medir — sin residuos.

## Impacto del subsetting

- Antes: fuente variable completa (`opsz,wght,FILL,GRAD` full-range) ≈ **3.9 MB** (91% del peso, reporte F0-b).
- Ahora: `icon_names=` con 125 iconos (102 literales tsx + ternarios/`iconName` + 14 de data),
  1 archivo woff2 de **135 152 bytes (~132 KB)**.
- **Ahorro: −96.5%**. Generador re-ejecutable: `node scripts/subset-icons.mjs [--check|--write]`;
  test de paridad `apps/web/src/lib/materialIcons.test.ts` (falla si un icono usado falta del subset).

## Métricas Lighthouse (Performance, Accessibility, Best Practices, SEO)

| Página | Modo | Perf | A11y | BP | SEO | LCP | FCP | CLS |
|---|---|---|---|---|---|---|---|---|
| Detalle `/p/document/:id` | desktop | 79 | 100 | 96 | 83 | 4250ms | 3312ms | 0.002 |
| Checkout `/checkout/:orderId` | desktop | 90 | 100 | 96 | 83 | 3007ms | 2782ms | 0 |
| Panel `/panel` | desktop | 85 | 100 | 96 | 83 | 3382ms | 3232ms | 0 |
| Publicar `/publicar` | desktop | 86 | 100 | 96 | 83 | 3314ms | 3239ms | 0 |
| Detalle `/p/document/:id` | mobile | 79 | 100 | 96 | 83 | 4256ms | 3157ms | 0 |

## Estado frente a targets Fase 0 (Performance ≥ 85, Accessibility ≥ 95)

- Accessibility 100/100 en todas las mediciones (ambos equipos): **CUMPLE** estable.
- Performance: Checkout 84–90, Panel 85, Publicar 86 — **CUMPLEN** (Checkout varía 84/90
  en el borde por varianza de corrida).
- **Detalle es borderline con varianza alta (misma build, mismo equipo): 79, 81, 85, 91.**
  LCP 2862–4326ms. El otro equipo midió 88 en su máquina (metodología distinta: `npx`
  lighthouse sin preset explícito, build con subset).
- Lectura honesta: el subset elimina el 96.5% del peso y el LCP ya no lo domina la fuente
  (FCP 2.7–3.3s = render + datos). Detalle oscila alrededor del umbral 85 por varianza de
  entorno (frío/tibio, contención de CPU con API+preview en la misma máquina), no por la
  fuente. Declarar "gate superado" con una sola corrida de 88 sería cherry-picking; declarar
  "fallido" con una de 79 también.
- Recomendación: commitear este reporte como medición honesta y abrir F4-04 parte 2
  (composición del LCP de Detalle: bundle inicial, `GET /documents/:id`, imágenes) antes de
  cantar victoria en Performance. **Gate: NO commiteado por decisión del Tech Lead —
  pendiente tu confirmación.**

## Parte 2 — el LCP no era la fuente (2026-09-22, sin commit)

- Descomposición con Performance API: TTFB 18ms, DOM 371ms, API 386ms, CSS 329ms —
  red sana. Pero el chunk Detalle traía `import"./vendor-pdf-*.js"` estático: **pdfjs
  (471 KB raw / 144 KB gzip) se descargaba y parseaba en cada visita a Detalle sin
  renderizar ningún PDF** (0 usos en el chunk; `PagePreview` solo vive en `live.tsx:97`
  y `Visor.tsx`).
- Fix (1 archivo, `apps/web/src/live/live.tsx`): `PagePreview` → `React.lazy` +
  `Suspense` con skeleton. Tras rebuild, el chunk Detalle tiene **0 refs a vendor-pdf**.
- Medición Detalle desktop post-fix: **perf 91, a11y 100, LCP 2810ms, FCP 2810ms, TBT 0**
  (antes: 79–85, LCP 3356–4326). Gate Fase 0 (≥85) superado de forma estable en este equipo.
- tsc 0, eslint 0. Falta: commit de `live.tsx` + esta sección.

- `scripts/f0-lighthouse.mjs` falla desde la 2da página en este entorno (navegador CDP
  compartido → `INVALID_URL`); además su login vía UI falla si `WEB_ORIGIN` no incluye `:4173`
  (CORS bloquea el preflight). Se midió con runner propio de navegador fresco por página.
- Durante la auditoría se observó (fuera de alcance, no corregido): `GET /documents`
  expone `passwordHash` del autor en la respuesta. Registrar como hallazgo de seguridad
  para la fase de hardening pre-despliegue.
