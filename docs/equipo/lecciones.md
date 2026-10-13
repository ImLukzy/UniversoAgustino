# Lecciones del equipo (léelo antes de empezar)

Errores reales que ya nos costaron tiempo. Breve a propósito.

## Comprobaciones
- Antes de reportar, `npm run verify` (igual que el CI). No sustituirlo por una lista manual: el 2026-10-12 el CI falló por un control que no estaba en la lista.
- `any-budget` cuenta la **palabra** `any` en `src`, también en tests (`expect.any(...)` lo rompe). Usa `toBeInstanceOf`, `expect.objectContaining` u otras aserciones.
- Vitest de la web ejecuta todo `src/**/*.test.{ts,tsx}` en entorno `node` (sin jsdom): los tests de componentes usan `renderToStaticMarkup`.

## Web
- Compila la web **desde `apps/web`** (`cd apps/web && npx vite build …`). Desde la raíz con `-c` Tailwind purga clases y aparecen falsos fallos de contraste o desborde.
- UI estricta de `CLAUDE.md`: solo tokens `primary*`, error `#b91c1c`, `SPRING`, componentes < 150 líneas, 0 px de scroll a 375 px. Un icono nuevo exige `node scripts/subset-icons.mjs --write`.
- Pantallas de sanción, retiro o dinero: siempre con confirmación (`ConfirmModal`) y sin doble envío.
- Evita `aria-live` en contadores que cambian en cada tecla.

## Datos y producción
- Nunca toques la BD de producción ni hagas push: lo hace el integrador con OK humano.
- QA y E2E solo con datos `qa-*` (`npm run qa:seed`, `npm run e2e`); el seed decide por **host** y rechaza producción.
- Migraciones: nuevas y fechadas; nunca editar una aplicada. No aplicarlas tú: el integrador las aplica en dev y luego en producción.
- Datos de cuentas de cobro reales: jamás en el repo; en pruebas usa la cuenta ficticia (QA Cuenta, 900000000).

## Orca y git
- Codex: el comando `orca` falla en su sandbox; usa `/home/lukzy/.local/bin/orca-ide`.
- Commits a nombre de `ImLukzy <lukas.melgar@tecsup.edu.pe>`, sin menciones a IA ni `Co-Authored-By`.
- No edites `docs/specs/NN` §6/§7 (lo hace el integrador) para evitar conflictos entre escritores.
- Si te llega una aclaración a mitad de tarea, léela con `orca-ide orchestration check` antes del `worker_done`.
