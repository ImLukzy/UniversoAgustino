# Auditoria Lighthouse - F0-b

Fecha: 2026-09-22 - lighthouse 13 (libreria) sobre Chrome del sistema headless, build de produccion (`vite preview`), viewport desktop por defecto, categorias performance+accessibility, sesion admin preservada.

> Nota de rutas: el plan cita Detalle como `/d/:id`; la ruta real es `/p/:type/:id`. Se midio `/p/document/:id`.

| Pagina | Ruta | Perf | A11y | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|
| Detalle | `/p/document/cmuc69gij000311t3pao7ea0t` | 83 | 100 | 3258ms | 3710ms | 0ms | 0.002 | 3258ms |
| Checkout | `/checkout/cmuc69hvz000a11t34nk8ttni` | 99 | 100 | 1186ms | 1572ms | 94ms | 0.000 | 1186ms |
| Panel | `/panel` | 94 | 100 | 1319ms | 1657ms | 257ms | 0.006 | 1319ms |
| Publicar | `/publicar` | 95 | 100 | 1233ms | 1829ms | 247ms | 0.000 | 1233ms |

finalUrl verificado en cada corrida (sin redireccion a /login: sesion valida).

## Correcciones aplicadas (a11y 91-94 -> 100)

La unica auditoria de accesibilidad que fallaba era `target-size` (no la cubre axe-core):
6 enlaces del footer (`StitchFooter`, `font-body-sm` ~18px de alto < 24px minimo) en las 4 paginas.
Fix: `inline-flex min-h-[24px] items-center` en todos los anchors del footer (incluidos los
`font-label-sm` de la barra inferior, preventivos). Ademas `unsized-images`: los 2 logos
`logo-ua.svg` (header h-10, footer h-8) sin `width`/`height`; se agregaron atributos segun el
viewBox 200x160 (50x40 y 40x32; tambien el de Login 55x44). Re-medicion: a11y 100/100/100/100.

## Hallazgo de performance (pre-existente, sin cambios de codigo en F0-b)

Detalle varia entre corridas: perf 68/LCP 23.4s (frio) <-> perf 83/LCP 3.7s (tibio).
Causa medida (`network-requests` del LHR): **la fuente variable Material Symbols pesa 3909 KB**
(el 91% de los 4271 KB totales; el resto: vendor-pdf 141, vendor-react 53, fuentes Inter/Jakarta
74 KB). Con throttling movil simulado (1.6 Mbps), esos 3.9 MB tardan ~20s y arrastran LCP/TTI.
La API es estable (15 muestras a GET /documents/:id: min 294ms, p50 301ms, max 454ms): no es
el cuello. Los fixes de F0-a agregan 0 bytes (solo swaps de clases CSS y 4 hex de colores).

Decision: no se toca la carga de fuentes en este sprint (blast radius: todos los iconos de todas
las paginas). Follow-up para F4-04 (tiene gate de presupuesto): acotar los ejes del request
css2 (`opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200` -> solo los usados) o subset estatico.

Chunk inicial (build actual): index 58.76 + vendor-react 53.53 + vendor-query 12.54 + css 9.73
~= 135 KB gzip (presupuesto F4-04: 250 KB). vendor-pdf 143.90 KB gzip fuera del inicial.
Baseline decia index 222 + react 160 + query 41 KB (sin aclarar gzip); no comparable 1:1.

## Comparacion contra el baseline

`docs/baseline-2026-09.md` tenia Lighthouse y axe como Pendiente: no hay regresiones posibles,
esta es la primera medicion real. Los pendientes del baseline quedan cubiertos salvo p95
(ver `docs/medicion-p95.md`).

Reproduccion: `npm run build -w apps/web`, preview en :4173 (nota: requiere
`http://localhost:4173` en `WEB_ORIGIN` del .env solo durante la auditoria; revertido despues),
`node scripts/f0-lighthouse.mjs`.
