# Reglas Base - Enfermeria-Hub (Clon de Studocu)

## 1. CONTEXTO ABSOLUTO DEL PROYECTO
- **Si necesitas entender el backend, Prisma, Auth, o la lógica de negocio, LEE SILENCIOSAMENTE el archivo `docs/PROJECT_CONTEXT.md` antes de actuar.** Ese es tu mapa mental.

## 2. SISTEMA DE SKILLS
Antes de ejecutar una tarea, decide qué skill necesitas y **LÉELA SILENCIOSAMENTE**:
- Frontend/UI → `docs/skills/studocu-ui-architect.md`
- Backend/Prisma/Pagos → `docs/skills/bazar-engine-expert.md`
- Tareas mixtas (p. ej. endpoint + pantalla) → ambas.
- Si vas a replicar o inspirar una interfaz visual -> Lee `docs/skills/site-cloner.md`

## 3. METODOLOGÍA Y ECONOMÍA DE TOKENS
- NO expliques código en la terminal. Solo dime "Hecho".
- Trabaja estrictamente basado en las Especificaciones (`docs/specs/`), paso a paso. Marca siempre el checklist con `[x]`.
- Antes de marcar una spec: typecheck, lint y test en verde.

## 4. UI/UX "STUDOCU SKILL" (ESTRICTO)
- **Referencia:** Clon de Studocu. Minimalismo absoluto, foco en PDFs académicos.
- **Estética:** Fondos `bg-white` o `bg-zinc-50`. Bordes sutiles. Acento principal en Teal (`#00685F`).
- **Tema dinámico:** Los acentos usan los tokens de carrera (`primary`, `primary-soft`, `primary-ink` → `--hub-p*`, spec 05). Nunca colores fijos (`blue-600`, `emerald`) en acentos.
- **Motion:** SIEMPRE usa `framer-motion` (`type: "spring", stiffness: 400, damping: 30`) para layouts y modales.
- **Limpieza:** Cero Layout Shifts. Componentes pequeños (< 150 líneas).
