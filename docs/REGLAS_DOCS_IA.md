# Reglas de condensación semántica (docs para IA)
Objetivo: una sesión nueva entiende el proyecto leyendo solo `CLAUDE.md` (< 1 500 tokens); el resto se abre bajo demanda.

1. **Un dato, un lugar.** Cada hecho vive en un solo archivo y los demás lo enlazan por ruta (`ver docs/API_SPECS.md`). Prohibido copiar tablas, listas de variables o reglas entre archivos: el duplicado envejece y confunde.
2. **Tabla o lista antes que prosa.** Endpoints, modelos, variables y estados van en tablas o líneas `clave: valor`. Sin introducciones, cortesías ni "como se mencionó". Una línea = una regla verificable.
3. **Nombres exactos del código.** Se usan rutas, identificadores y códigos reales (`requireSameOrigin`, `EMAIL_NO_AUTORIZADO`, `apps/api/src/lib/cookies.ts`), nunca paráfrasis ("el middleware de seguridad"). Si algo no existe en el código, se marca `no implementado`.
4. **Solo el estado vigente.** Los docs describen lo que el código hace hoy. El historial va en git y en el §7 de cada spec; lo obsoleto se borra, no se tacha. Todo cambio de ruta, variable o modelo actualiza su doc en el mismo commit.
5. **Presupuesto por archivo.** `CLAUDE.md` ≤ 80 líneas / 1 500 tokens; skills ≤ 30 líneas; `API_SPECS.md` una fila por endpoint. Si un archivo supera su presupuesto, se divide por tema y `CLAUDE.md` solo enlaza a la parte nueva.
