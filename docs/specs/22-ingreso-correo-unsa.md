# Especificación: 22 - Ingreso con correo institucional (código al buzón)

## 1. Objetivo
**Problema:** el modal de acceso solo ofrecía Google y Apple. Quien no quiere o no puede usar un proveedor no tenía cómo entrar.
**Resultado esperado:**
- El modal (`AuthModalHost`) tiene un campo "Correo institucional" (estilo Studocu: proveedores, separador "o", correo), sin quitar Google ni Apple.
- El backend acepta solo el dominio exacto `@unsa.edu.pe` (más la excepción autorizada) y envía un código de 6 dígitos al buzón. Canjear el código prueba que la cuenta existe, está activa y es de quien la escribe. Un correo inventado, suspendido o externo nunca obtiene sesión.
- Primer canje = registro automático con perfil pendiente → `OnboardingGate` lleva a `/bienvenida` (correo bloqueado; facultad, carrera, ciclo, celular). Si la cuenta ya existe, ingreso directo.

## 2. Seguridad
- Código: `crypto.randomInt`, 10 min, un solo código vivo por correo, máx. 5 intentos, canje atómico (un código = una sesión). En BD solo el HMAC-SHA256 ligado al email.
- Límites: `/start` 10/15 min por IP + 5/hora por correo + 60 s entre envíos; `/verify` 30/15 min por IP. Ambos con `requireSameOrigin`.
- Producción con `MAIL_DRIVER=console` → `/start` responde 503 (no se aceptan correos que nadie recibiría).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/auth.ts` / `auth.test.ts` | modificar | `EmailStartSchema`, `EmailVerifySchema` (normaliza, dominio exacto, 6 dígitos) |
| `apps/api/prisma/schema.prisma` + migración `20260927090000_email_login_code` | crear | modelo `EmailLoginCode` |
| `apps/api/src/lib/loginCode.ts` / `.test.ts` | crear | generación, HMAC, `checkLoginCode()` puro |
| `apps/api/src/lib/mailer.ts` | modificar | `sendLoginCode()`, driver `resend` (HTTP), `canDeliver()` |
| `apps/api/src/modules/auth/emailLogin.ts` | crear | `POST /auth/email/start`, `POST /auth/email/verify` |
| `apps/api/src/modules/auth/{routes,account}.ts` | modificar | registro de rutas; mensaje `OAUTH_ONLY` |
| `apps/web/src/lib/emailLogin.ts` / `.test.ts` | crear | autocompleta `@unsa.edu.pe`, validación previa, solo dígitos |
| `apps/web/src/components/auth/{EmailCodeLogin.tsx,useEmailLogin.ts}` | crear | pasos correo → código (misma altura, sin CLS) |
| `apps/web/src/components/AuthModalHost.tsx` | modificar | separador "o" + formulario de correo |
| `.env.example`, `apps/api/docs/openapi.yaml`, `docs/oauth.md` | modificar | `MAIL_DRIVER`, `RESEND_API_KEY`, `MAIL_FROM`; endpoints |

## 4. Checklist
- [x] T1 Esquemas compartidos + tests (dominio exacto, normalización, código).
- [x] T2 Modelo + migración aplicada; `loginCode` con tests (correcto, otro correo, vencido, usado, intentos).
- [x] T3 Endpoints `/auth/email/start` y `/auth/email/verify` con límites, canje atómico y auditoría (`auth.email.register` / `auth.email.login`).
- [x] T4 Modal: campo de correo + paso de código; cuenta nueva → `/bienvenida`, existente → sesión directa.
- [x] T5 `npm run typecheck`, `npm run lint`, `npm test` en verde.

## 5. Verificación
- `typecheck` 0, `lint` 0; tests api 48, web 47, shared 41.
- En vivo (curl): Gmail, `unsa.edu.pe.evil.com`, `notunsa.edu.pe` → 403 `EMAIL_NO_AUTORIZADO`; reenvío inmediato → 429 `ESPERA_REENVIO`; código errado → 400; correcto → 201 `isNew:true` con perfil pendiente; mismo código otra vez → 410; cuenta existente → 200 `isNew:false`; 6.º intento → 429 `DEMASIADOS_INTENTOS`.
- Playwright 1280 y 375: Gmail muestra "Usa tu correo @unsa.edu.pe"; se escribe solo el usuario y se completa el dominio; código errado muestra el error; código correcto → `/bienvenida?next=%2Fpedidos` con el correo bloqueado; ambos pasos miden igual (sin CLS); 0 px de scroll horizontal; 0 errores de página. Datos QA borrados.
