# Especificación: 47 - Solo el dueño edita o elimina su publicación

## 1. Objetivo
**Problema:** `PATCH`/`DELETE /documents/:id` (`apps/api/src/modules/documents/manage.ts:36-60`, `canEditDoc`) y `PATCH`/`DELETE /bazar/:id` (`apps/api/src/modules/bazar/routes.ts:64-88`, `canEditBazar`) aceptan al dueño **y además** a `admin` y `moderator`. Un trabajador puede borrar o cambiar una publicación ajena sin motivo, sin aviso al dueño y sin rastro de moderación, saltándose la decisión D1 de la spec 46 (el equipo **retira**, no borra).
**Resultado esperado:** solo el dueño edita o elimina su publicación. El equipo actúa únicamente con retirar/restaurar (spec 46) y la moderación de revisión existente.

## 2. Fuera de alcance
- Retirar/restaurar, takedown, cola de revisión y reportes (specs 46 y anteriores): sin cambios.
- La web: ninguna pantalla del equipo usa estas rutas (solo `components/publicaciones/useListingEditor.ts`, del dueño).

**Decisiones de producto:** aprobada por el humano 2026-10-12 (recomendación "seguridad" de la revisión).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/src/modules/documents/manage.ts` | modificar | `canEditDoc` → solo `authorId === me`; mensajes 403 "Solo el dueño edita/elimina su publicación" |
| `apps/api/src/modules/bazar/routes.ts` | modificar | `canEditBazar` → solo `sellerId === me` |
| tests en `apps/api/src/**` | crear / modificar | dueño 200; moderator y admin 403 en PATCH y DELETE de ambos tipos |
| `apps/api/docs/openapi.yaml` | modificar | descripción de permisos de esas 4 rutas |

## 4. Diseño y lógica
- `PATCH`/`DELETE` de documento y bazar: 403 `FORBIDDEN` para cualquiera que no sea el dueño, incluidos `moderator` y `admin`. El resto del comportamiento (409 por pedidos activos, `resubmitReview`, auditLog) no cambia.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1–A4 | Tipos, lint, tests, contrato | `npm run verify` (o los comandos del CI) | en verde |
| A3b | Tests nuevos | moderator 403 y admin 403 en PATCH y DELETE de documento y bazar; dueño sigue 200 | pasan |
| A5 | Tamaño | archivos tocados ≤ 150 líneas | OK |

## 6. Checklist de ejecución
- [ ] Tarea 1: restringir permisos + tests + openapi.
- [ ] Tarea 2: verificar A1–A5 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
