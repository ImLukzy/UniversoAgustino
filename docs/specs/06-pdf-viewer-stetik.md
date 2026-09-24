# Especificación: 06 - Visor de Documentos Inmersivo (Studocu Stetik)

## 1. Objetivo y Contexto
**Descripción:** `apps/web/src/pages/Visor.tsx` (342 líneas al redactar; hoy 135) ya renderiza el PDF con `pdfjs-dist` en lazy vía `GET /uploads/:name?stream=1` (con `Range`, same-origin). Protege el contenido mostrando solo las páginas 1–2 cuando el documento es de pago y no se ha comprado. Mezcla en un mismo archivo la lógica de acceso, la barra de herramientas y el render.
**Objetivo técnico:** Rediseñar la ruta `/v/:id` como un visor inmersivo tipo Studocu: centrado, sin distracciones, con acciones de Descargar y Guardar (like), y sin superficies XSS. Se divide en componentes de menos de 150 líneas.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Layout:**
  - Fondo `bg-zinc-50` y páginas en "hojas" `bg-white` con `shadow-sm`, centradas en una columna `max-w-3xl`.
  - Cabecera sticky mínima: título (1 línea), curso · carrera en `zinc-500` y acciones a la derecha.
- **Acciones:**
  - `Guardar` (icono `bookmark`, relleno con el color de la carrera al estar activo).
  - `Descargar` (solo si es gratis o ya está comprado).
  - `Comprar S/ X.XX` como botón primario (`bg-primary`), solo si es de pago y no está comprado.
- **Paywall:** desde la página 3 en adelante se muestra un degradado `from-transparent to-white` sobre una hoja borrosa, con una CTA centrada. La altura se reserva de antemano para evitar CLS.
- **Motion:** las hojas entran con fade-in-up (spring 400/30) al entrar en el viewport, y la barra de acciones aparece con `AnimatePresence` al hacer scroll.
- **Skeleton:** hojas con relación A4 (`aspect-[1/1.414]`) idénticas a las finales.

## 3. Arquitectura y Lógica de Negocio
- **API existente:**
  - `GET /documents/:id` devuelve el `Document` (`fileUrl`, `priceCents`, `status`).
  - `GET /uploads/:name?stream=1` sirve el PDF.
  - El acceso completo requiere un `Order` en estado `PAID`/`ESCROW`/`RELEASED` del `buyerId = req.user.sub`, o ser el autor.
- **Nuevo (Guardar):**
  - Modelo Prisma `SavedDocument { userId, documentId, createdAt, @@id([userId, documentId]) }` con una migración nueva fechada. No se edita ninguna migración aplicada.
  - Endpoints `POST /documents/:id/save` y `DELETE /documents/:id/save`, más el campo `saved: boolean` en `GET /documents/:id`.
  - Documentar todo en `openapi.yaml` (gate `docs:check`).
- **Anti-XSS:**
  - Render exclusivamente sobre `<canvas>`, con la capa de texto de pdf.js deshabilitada y `isEvalSupported: false`.
  - Prohibido `dangerouslySetInnerHTML`. Título y descripción se muestran como texto React.
  - `fileUrl` se valida como nombre UUID de `/uploads` antes de pedirlo, sin concatenar URLs externas.
- **Descarga:** la API resuelve el permiso. No hay URL prefirmada en el cliente si no hay acceso.
- **Componentes:** `viewer/ViewerHeader.tsx`, `viewer/PdfPages.tsx`, `viewer/Paywall.tsx`, `viewer/useDocAccess.ts`.

## 4. Checklist de Ejecución
- [x] Tarea 1: Añadir el modelo `SavedDocument` y su migración, los endpoints save/unsave y `saved` en el detalle, y actualizar `openapi.yaml`.
- [x] Tarea 2: Extraer `useDocAccess(id)` (compra, autoría y gratis) desde `Visor.tsx`.
- [x] Tarea 3: Crear `ViewerHeader` con Guardar/Descargar/Comprar coloreados con `primary` de la carrera.
- [ ] Tarea 4: Crear `PdfPages` (canvas, lazy por página con IntersectionObserver, `isEvalSupported: false`, sin capa de texto).
- [x] Tarea 5: Crear `Paywall` con altura reservada y degradado, y la CTA al checkout (`routes.ts`).
- [x] Tarea 6: Recomponer `Visor.tsx` por debajo de 150 líneas; skeleton A4 1:1; verificar CLS≈0 y que no hay `dangerouslySetInnerHTML`.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** `SavedDocument` en `schema.prisma` + migración `20260923120000_saved_documents`. Los endpoints `POST/DELETE /documents/:id/save` están en `modules/documents/manage.ts`, y `saved` en el detalle en `listing.ts`; todo documentado en `openapi.yaml`. `components/viewer/` contiene `ViewerHeader`, `PdfPages`, `Paywall` y `useDocAccess`. `Visor.tsx` tiene 135 líneas y no hay `dangerouslySetInnerHTML` en la web.
- **Tarea 4 desmarcada.** `PdfPages.tsx` llama a `getDocument` sin `isEvalSupported: false` (solo `enableXfa: false`). El render es de canvas, sin capa de texto, y usa IntersectionObserver.
- **Riesgo abierto.** El cliente recibe `fileUrl` y descarga el PDF completo; el paywall (páginas 1–2) es solo visual en el cliente. Esto contradice "Descarga: la API resuelve el permiso". Cerrarlo exige servir solo las páginas de muestra desde el servidor.
