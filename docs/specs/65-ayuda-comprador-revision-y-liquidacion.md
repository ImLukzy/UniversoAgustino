# Especificación: 65 - Ayuda al comprador, publicación en revisión y cuenta de liquidación

## 1. Objetivo
Corrige tres hallazgos de la revisión de usabilidad de Angela (2026-10-13). Su reporte está en `/tmp/usabilidad/reporte.md`.

**Problemas:**
1. **Bloquea.** En `/pedidos`, el botón lateral «¿Problemas? Abrir un reporte» (`apps/web/src/pages/Pedidos.tsx:87`) lleva a `/ventas` (`ROUTES.mySales`), el panel del vendedor. Un comprador con un problema termina en una pantalla ajena. Las vías reales ya existen en cada pedido:
   - «Reportar al vendedor» (`BuyerOrderRow.tsx:81`).
   - «Enviar reclamo» de un apunte en custodia (`PaymentClaim`, en el seguimiento del pedido).
2. **Confunde.** Cuando el dueño abre su propia publicación pendiente de revisión, el detalle (`apps/web/src/components/detalle/BuyPanel.tsx`) no indica nada: parece publicada, pero no está en el catálogo. Tampoco se avisa de que está rechazada ni de que el propio dueño la pausó: hoy el aviso de pausa solo lo ve quien no es el dueño (`useDetail.ts:45`). En `/publicaciones`, el chip «En revisión» no explica qué significa.
3. **Confunde.** Al publicar, el bloque de cobro (`apps/web/src/components/publicaciones/PayFields.tsx:32`) dice «¿Cómo te pagan?». El vendedor entiende que el comprador le pagará directamente, cuando en realidad es la cuenta donde **el equipo le liquida** su parte (RFC 0003: el comprador paga al equipo, comisión del 13 % a cargo del vendedor, liquidación en 24–48 h).

**Resultado esperado:** el comprador encuentra dónde reportar sin salir de sus pedidos. El dueño ve el estado real de su publicación en su detalle y en su lista. El vendedor entiende para qué sirve su cuenta de cobro.

## 2. Fuera de alcance
- El flujo de reportes y reclamos, la API, los estados y los cálculos.
- Rediseñar el panel principal (hallazgo 4) o añadir el botón rápido de pausa (hallazgo 5).
- Prometer plazos de revisión de publicaciones, porque no hay un plazo definido.
- Cambiar el porcentaje o las reglas de comisión. El texto solo explica las reglas vigentes.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna. El humano aprobó los hallazgos 1, 2 y 3 el 2026-10-13, incluidos los textos de cobro de §4.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/pages/Pedidos.tsx` | modificar | quitar el enlace a `/ventas`; poner el texto de ayuda de §4.1 |
| `apps/web/src/components/detalle/useDetail.ts` | modificar | exponer `ownerReview` (`reviewStatus`/`reviewNote`) y `pausedForOwner` cuando `isOwner` |
| `apps/web/src/components/detalle/BuyPanel.tsx` (u otro componente nuevo si se pasa de 150 líneas) | modificar | aviso para el dueño según §4.2 |
| `apps/web/src/components/equipo/ReviewChip.tsx` o `ListingRow.tsx` | modificar | en `/publicaciones`, explicar «En revisión» (§4.2) |
| `apps/web/src/components/publicaciones/PayFields.tsx` | modificar | textos de §4.3 |
| tests web | crear o modificar | render estático de cada caso |

## 4. Diseño y lógica
**4.1 Ayuda al comprador (`/pedidos`, tarjeta lateral «¿Cómo funciona la custodia?»).** Se sustituye el botón por este párrafo (`text-xs text-zinc-600`), con el mismo margen que tenía el botón:
> «¿Problemas con un pedido? Ábrelo en la lista y usa **Reportar al vendedor**. Si pagaste un apunte y no recibiste acceso, usa **Enviar reclamo** en su seguimiento: congela el pago al vendedor hasta que el equipo lo revise.»

Antes hay que comprobar en el código que los dos nombres de botón existen tal cual. Si alguno es distinto, se usa el texto real.

**4.2 Estado para el dueño.**
- **Detalle propio** (`isOwner`): un aviso `role="status"` bajo el título, con el estilo de los chips actuales y estos textos:
  - `reviewStatus === "PENDING"`: «En revisión: solo tú la ves. Aparecerá en el catálogo cuando el equipo la apruebe.»
  - `reviewStatus === "REJECTED"`: «Rechazada: {nota o "sin motivo registrado"}. Edítala desde Mis publicaciones para enviarla de nuevo.»
  - Pausada por el dueño: «Pausada: los compradores no la ven. Reactívala desde Mis publicaciones.»
  - Retirada: el aviso actual «Retirada por moderación».
  - Primero hay que comprobar que `GET /documents/:id` y `GET /bazar/:id` devuelven `reviewStatus` y `reviewNote` al dueño. Si no los devuelven, se reporta y no se toca la API en esta spec.
- **Lista `/publicaciones`:** junto al chip «En revisión», una línea `text-xs text-zinc-600` que diga «Solo tú la ves hasta que el equipo la apruebe.». No se añade nada para aprobadas ni rechazadas, porque la rechazada ya muestra su motivo.
- No cambia nada de lo que ve quien no es el dueño.

**4.3 Cuenta de liquidación (`PayFields`, usado en `/publicar` y en el editor).**
- La etiqueta «¿Cómo te pagan?» pasa a ser «¿Dónde te pagamos tu parte?».
- Encima del grid se añade una línea `sm:col-span-2`, `text-xs text-zinc-600`:
  > «Los compradores pagan al equipo, no a ti. Cuando la venta se confirma, te transferimos tu parte (el precio menos la comisión del 13 %) a esta cuenta, normalmente en 24–48 h.»
- «QR de cobro (imagen)» pasa a ser «QR de tu Yape o Plin (imagen)».
- El texto no puede llevar «13» como literal en el componente: se obtiene de `PLATFORM_FEE_PCT` de `@hub/shared`, igual que `useDetail.ts:4`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Gate | `npm run verify` | en verde |
| A2 | Ayuda | test de `/pedidos` | no hay enlace a `/ventas` en la tarjeta; aparece el texto de §4.1 |
| A3 | Dueño | tests del aviso | PENDING, REJECTED (con y sin nota), pausada y retirada; quien no es dueño no ve los avisos de revisión |
| A4 | Liquidación | test de `PayFields` | textos de §4.3 y comisión no escrita como literal |
| A5 | E2E | `npm run e2e:ci` | 7 suites ✓ |
| A6 | UI | capturas a 375 y 1280 de `/pedidos`, del detalle propio en revisión y de `/publicar` paso 2 | sin scroll horizontal; CLS 0 |

## 6. Checklist de ejecución
- [x] Tarea 1: §4.1.
- [x] Tarea 2: §4.2 (detalle y lista).
- [x] Tarea 3: §4.3.
- [x] Tarea 4: A1–A6.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1 | ✅ | `npm run verify` en verde (Dwight 04d341a y Claudio tras integrar 72a2d21) |
| 2026-10-13 | A2 | ✅ | `PedidosHelp.test.tsx`: texto de §4.1, sin `href="/ventas"` en la tarjeta; botones reales «Reportar al vendedor» y «Enviar reclamo» |
| 2026-10-13 | A3 | ✅ | `OwnerListingNotice.test.tsx` y `ReviewChip.test.tsx`: PENDING, REJECTED con y sin nota, pausada, retirada, sin aviso para quien no es dueño. GET `/documents/:id` y `/bazar/:id` devuelven `reviewStatus`/`reviewNote` al dueño |
| 2026-10-13 | A4 | ✅ | `PayFields.test.tsx`: textos de §4.3 con `PLATFORM_FEE_PCT` |
| 2026-10-13 | A5 | ✅ | `npm run e2e:ci` en la rama integrada: 7 suites ✓ |
| 2026-10-13 | A6 | ✅ | `/tmp/spec65/` (pedidos, detalle en revisión, publicar paso 2) a 375 y 1280: sin scroll horizontal; Dwight fijó tamaño de iconos del encabezado y `min-w-0` en el detalle para CLS |
| 2026-10-13 | Auditoría | ✅ | Kelly (task_0d4941548ef2): textos exactos y extras de Dwight correctos (el dueño no ve compra ni paywall; «disponible» exige publicado y aprobado). Su único bloqueo (`StaticRouter` indefinido en `PedidosHelp.test.tsx`) fue un falso positivo: su worktree tenía react-router-dom 6.30.6 instalado; con las dependencias del repo (7.18) el test pasa |
