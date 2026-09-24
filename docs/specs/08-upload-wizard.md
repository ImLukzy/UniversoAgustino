# Especificación: 08 - Wizard de Subida (Gratis o con Precio)

## 1. Objetivo y Contexto
**Descripción:** `Monetiza.tsx` (636 líneas) mezcla landing de monetización, simulador y formulario. Por otro lado, `/subir-material` (`pages/SubirMaterial.tsx`, 523 líneas) ya es un wizard, aunque grande.
**Objetivo técnico:** Unificar ambos en un wizard de 3 pasos animado con Framer Motion que permita subir un PDF **gratis** o **con precio**, con el desglose transparente de la comisión del 13 %. `/monetiza` queda como landing breve que enlaza al wizard.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Contenedor:** tarjeta `max-w-2xl` centrada sobre `bg-zinc-50`, con una barra de progreso de 3 segmentos en `bg-primary` (color de la carrera).
- **Pasos:**
  1. **Archivo:**
     - Dropzone amplia (`border-dashed border-zinc-200`) que acepta PDF.
     - Al subir, muestra la miniatura de la página 1 y el nombre del archivo.
  2. **Detalles:**
     - Título, curso, ciclo y tipo (`APUNTE | PAE | BALOTARIO | GUIA`; PAE solo en Enfermería).
     - Carrera precargada desde el perfil y descripción opcional.
  3. **Precio:**
     - Toggle segmentado `Gratis | Con precio`.
     - Con precio: input en soles, desglose en vivo `Precio · Comisión 13 % · Recibes`, y el método de cobro Yape/Plin con QR.
- **Motion:** transición entre pasos con `AnimatePresence mode="wait"`, desplazamiento en x de ±24 px y spring 400/30. La altura del contenedor se anima con `layout` para no saltar.
- **Validación:** inline bajo cada campo. El botón "Siguiente" queda deshabilitado mientras el paso no es válido.

## 3. Arquitectura y Lógica de Negocio
- **Subida:** `POST /uploads` (multer, firma mágica PDF, nombre UUID, dedupe por checksum + dueño en `Upload`, rate limit de 30/h). Devuelve el nombre, que se guarda como `fileUrl`.
- **Publicación:** `POST /documents` valida con `CreateDocument` (Zod, `@hub/shared`) los campos `title`, `course`, `career`, `cycle`, `type`, `priceCents` (0 = gratis), `payMethod`, `payQrUrl` y `payDetail`.
- **Comisión:**
  - El desglose se calcula **solo** con `computePrice(priceCents)` (invariante `net + fee = amount`, 13 %). Prohibido calcular `* 0.13` en la UI.
  - `POST /monetization/simulate` sigue disponible para la landing.
- **Estado:** `useReducer` local con los pasos. Un borrador en `sessionStorage` (try/catch) para no perder datos al recargar.
- **Componentes** (`components/upload/`):
  - `UploadWizard.tsx`, `StepFile.tsx`, `StepDetails.tsx`, `StepPrice.tsx` y `PriceBreakdown.tsx`, todos de menos de 150 líneas.

## 4. Checklist de Ejecución
- [ ] Tarea 1: Crear `components/upload/` con el reducer de pasos y `UploadWizard` (barra de progreso `bg-primary`).
- [ ] Tarea 2: `StepFile`: dropzone, `POST /uploads`, miniatura de la página 1 (pdfjs lazy) y los errores del contrato `{ error }`.
- [ ] Tarea 3: `StepDetails` con la validación `CreateDocument` de `@hub/shared`; mostrar PAE solo para Enfermería.
- [ ] Tarea 4: `StepPrice` con el toggle Gratis/Con precio y `PriceBreakdown` usando `computePrice()`.
- [ ] Tarea 5: Transiciones `AnimatePresence` (spring 400/30) y altura animada sin layout shift.
- [ ] Tarea 6: Reducir `Monetiza` a una landing de menos de 150 líneas con CTA al wizard; `SubirMaterial` renderiza `UploadWizard`; typecheck, lint y test en verde.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **No implementado como se especifica.** Todas las tareas siguen sin marcar. Lo que existe hoy se construyó por otro camino:
  - **`/publicar`** (`pages/Publicar.tsx` + `components/publicar/`): `PublishHeader`, `StepDetails`, `StepFile`, `StepPriceLegal`, `PublishPreview` y `usePublishForm`. Es un formulario de 4 pasos (detalles → archivo → precio → declaración D.L. 822) para apunte digital o artículo físico. No existe `components/upload/`.
  - **`/subir-material`** (`pages/SubirMaterial.tsx` + `components/subir/`): subida múltiple independiente, no `UploadWizard`.
  - **`/monetiza`** (`pages/Monetiza.tsx`, 33 líneas): landing con CTA a `/publicar` (parte de la Tarea 6 cumplida).
- **Faltan:**
  - Reducer.
  - Toggle Gratis / Con precio: hoy el precio debe ser mayor que 0, así que **no se puede publicar gratis**.
  - Miniatura de la página 1.
  - Validación con `CreateDocument` (hoy es manual).
  - `AnimatePresence` entre pasos.
  - Borrador en `sessionStorage`.
- **Ya cumplido.** El desglose usa `computePrice()` + `PLATFORM_FEE_PCT`, PAE solo en Enfermería (`lib/publishing.ts`) y hay barra de progreso de subida en `bg-primary`.
- **Decisión pendiente:** adaptar esta spec a `/publicar` o migrar `/publicar` a `components/upload/`.
