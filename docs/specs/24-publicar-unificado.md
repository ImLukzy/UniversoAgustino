# Especificación: 24 - Un solo flujo de publicación (/publicar con lote)

## 1. Objetivo
**Problema:** hay dos flujos que publican apuntes con reglas distintas:
- `/publicar` (`pages/Publicar.tsx`): un archivo o un artículo de bazar, con carrera elegible, cobro (Yape/Plin + número/QR), desglose de comisión y declaración jurada D.L. 822.
- `/subir-material` (`pages/SubirMaterial.tsx`, `components/subir/*`): varios archivos a la vez, pero publica con `payMethod: "YAPE"` **sin número ni QR** (el comprador llega al checkout sin saber a dónde pagar), **sin la declaración D.L. 822** y con la carrera tomada del tema visual.

**Resultado esperado:** un único flujo `/publicar` que acepta uno o varios archivos. Con 2 o más archivos es un **lote**: comparten curso, ciclo, tipo, descripción, precio, páginas de muestra, cobro y declaración; cada archivo tiene su propio título. `/subir-material` redirige a `/publicar`.

## 2. Fuera de alcance
- Backend: se sigue usando `POST /documents` (uno por archivo).
- Flujo de artículos de bazar (sin cambios de lógica).
- Textos legales, de cobro o de comisión.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (se conserva toda función de ambos flujos y se corrigen dos fallos).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/lib/uploadQueue.ts` (+ `.test.ts`) | crear | reglas puras del lote (título desde archivo, listo, títulos) |
| `apps/web/src/components/publicar/useUploadQueue.ts` | crear | subida múltiple con progreso real por archivo |
| `apps/web/src/components/publicar/FileQueue.tsx` | crear | zona de arrastre múltiple + lista con progreso y título por archivo |
| `apps/web/src/components/publicar/{usePublishForm,StepFile,StepDetails,PublishHeader,PublishPreview}.ts(x)` | modificar | lote en el flujo único |
| `apps/web/src/pages/SubirMaterial.tsx`, `components/subir/*` | eliminar | reemplazados |
| `apps/web/src/app/AppRoutes.tsx`, `lib/routes.ts`, `lib/publishing.ts` | modificar | `/subir-material` → redirección a `/publicar` |
| `apps/web/src/components/AppSidebar.tsx`, `pages/Perfil.tsx` | modificar | un solo botón "Publicar" |

## 4. Diseño y lógica
- **Lote:** `items.length ≥ 2` en modo apunte. Paso 1 muestra "Lote de N archivos"; el título del paso 1 se desactiva y cada archivo tiene su título en el paso 2 (prellenado con el nombre del archivo).
- **Publicación:** secuencial; cada archivo publicado sale de la cola. Si uno falla, los restantes quedan para reintentar y se informa "Se publicaron X de N".
- **Destino:** un archivo → página del documento; lote → `/publicaciones` con aviso de éxito.
- **UI:** clases del sistema; acentos `primary*`; motion `SPRING`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | verde; + `uploadQueue.test.ts` |
| A5 | Tamaño | archivos tocados ≤ 150 líneas | ≤ 150 |
| A7 | Scroll horizontal | `/publicar` a 375 px | 0 px |
| A11 | Comportamiento | Playwright: `/subir-material` → `/publicar`; 2 archivos → "Lote de 2 archivos", títulos por archivo; publicar lote → 2 documentos con `payDetail` | pasa |

## 6. Checklist de ejecución
- [x] T1: `lib/uploadQueue.ts` + tests y `useUploadQueue`.
- [x] T2: `/publicar` con uno o varios archivos (lote) y publicación secuencial.
- [x] T3: eliminar `/subir-material` (redirección), menú y perfil.
- [x] T4: A1–A11 y registro.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | A1 | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | A2 | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | A3 | ✅ | api 52, web 53 (+5 `uploadQueue.test.ts`), shared 42 |
| 2026-09-24 | A5 | ✅ | mayor archivo tocado: `usePublishForm.ts` 117 líneas |
| 2026-09-24 | A7 | ✅ | `/publicar` a 375 px con lote de 2: 0 px |
| 2026-09-24 | A11 | ✅ | Playwright 375 (API local, `STORAGE_DRIVER=local`): `/subir-material` → `/publicar`; 2 PDF → "Lote de 2 archivos", títulos "Apunte QA lote uno/dos" desde el nombre, título del paso 1 desactivado; publicar → `/publicaciones`; `GET /documents/mine`: 2 documentos con `payDetail`, curso y precio compartidos; borrados después (200) |
| 2026-09-24 | Regresión | ✅ | Humo Playwright (con y sin sesión, 1280/375) en 18 rutas: 0 errores, 0 px de scroll horizontal. Corregidos de paso `/pedidos` (grilla `grid-cols-1`) y `/publicaciones` (buscador/orden flexibles), y `docs:check` (faltaba `/auth/onboarding` en OpenAPI) |
