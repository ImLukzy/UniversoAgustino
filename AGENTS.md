# AGENTS.md — UniversoAgustino

Reglas para cualquier agente (Codex, Antigravity/Gemini, OpenCode, Claude). **Antes de empezar, lee `CLAUDE.md` completo**: arquitectura, comandos, reglas críticas y UI estricta del proyecto.

@[CLAUDE.md](CLAUDE.md)

## Equipo y roles
- Claudio (worktree `Claudio`) planifica e integra en la rama `ImLukzy/Claudio`. Solo él une ramas y publica.
- Michael-Code (`grampus`) escribe código, una tarea a la vez, partiendo de `git merge --ff-only ImLukzy/Claudio`.
- Kelly-Auditor (`nuckelavee`) audita: **solo lectura**, no edita código, no hace commits ni cambia de rama. Hallazgos como BLOQUEANTE / IMPORTANTE / MENOR con archivo, línea y evidencia; lo no comprobado va como DUDA.
- Pam-QA (`ladyfish`) prueba: **solo lectura de código**; puede instalar dependencias, ejecutar tests y flujos, y ponerse en detached sobre la rama a probar. Reporta pasos para reproducir cada fallo.
- Jim-EXPLORA (`redfish`) explora: **solo lectura**; devuelve archivos, dependencias y riesgos.

## Reglas fijas
- Commits siempre a nombre de `ImLukzy <lukas.melgar@tecsup.edu.pe>` (autor y committer), **sin menciones a IA ni líneas `Co-Authored-By` / `Claude-Session`**.
- Nada a `main`, ningún push y ningún cambio en la base de datos de producción.
- Nunca commitear `.env` ni secretos; no imprimir secretos.
- Responde en español. Reporte final: resumen de 3–5 líneas · archivos tocados · cómo verificarlo · dudas o riesgos · estado OK o BLOQUEADO.
- Orca: si el comando `orca` falla en tu entorno, usa `/home/lukzy/.local/bin/orca-ide` con los mismos argumentos.
