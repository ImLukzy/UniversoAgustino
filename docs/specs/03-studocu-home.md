# Especificación: 03 - Rediseño Home (Studocu Clone UI)

## 1. Contexto y Objetivo
**Descripción:** El frontend actual tiene pantallas sobrecargadas. Vamos a crear la pantalla principal (Home) imitando la limpieza y jerarquía visual de Studocu.
**Objetivo Técnico:** Diseñar un Hero Section con un buscador gigante y limpio, y una grilla de "Documentos Recientes", usando el nuevo estándar de UI.

## 2. Diseño (Studocu Skill)
- **Hero Section:** Fondo claro, título masivo ("Estudia mejor con los apuntes de tu universidad"), y un input de búsqueda enorme, centrado, con bordes redondeados (`rounded-full`), un ícono de lupa y sombra sutil.
- **Layout de Cards:** Las cards de documentos deben ser limpias: un ícono de PDF/Doc, título truncado a 2 líneas, nombre de la universidad en gris, y cero botones de "Comprar" visibles de buenas a primeras (Studocu atrae al clic, no a la compra directa).

## 3. Estructura de Componentes (`apps/web/src/components/home/`)
1. `StudocuHero.tsx`: Componente visual del buscador gigante.
2. `HomeRecentDocs.tsx`: Grilla de documentos recientes usando `DocumentCard.tsx` (ya refactorizado).
3. `apps/web/src/pages/Home.tsx` (ruta `/home`; `/` muestra `PublicLanding` sin sesión): Envoltorio que unifica el Hero y la grilla.

## 4. Checklist de Tareas Granulares
*(Agente Opencode/Claude: Recuerda la regla Studocu. Minimalismo absoluto, esquinas redondeadas, mucho espacio en blanco).*

- [x] Tarea 1: Crear `apps/web/src/components/home/StudocuHero.tsx` con el input de búsqueda gigante inspirado en Studocu.
- [x] Tarea 2: Asegurar que el input de búsqueda tenga un debounce de 300ms (usando `useDebounce` o similar) antes de actualizar el estado, para evitar llamadas excesivas a React Query (Code Smell identificado en la auditoría).
- [x] Tarea 3: Modificar la página raíz (`Home.tsx` o la ruta `/` equivalente) para renderizar `StudocuHero` y limpiar cualquier lógica antigua de "Bazar" o botones innecesarios.
- [x] Tarea 4: Integrar una sección debajo del Hero llamada "Añadidos recientemente" renderizando una lista limpia.
- [x] Tarea 5: Verificar que no existan Layout Shifts y aplicar Framer Motion en la carga inicial de los elementos (fade in up).

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** `components/home/StudocuHero.tsx` (debounce de 300 ms con `lib/useDebounce.ts`), `HomeRecentDocs.tsx` y, además, `HomeBazarRow.tsx` (spec 07).
- **Ruta.** El Home vive en `/home` y `/` decide entre landing y Home según la sesión (`app/AppRoutes.tsx`).
- **Conflicto con la spec 12, Tarea 3.** El `h1` del Hero entra con `initial={{ opacity: 0 }}`, lo que retrasa el LCP.
