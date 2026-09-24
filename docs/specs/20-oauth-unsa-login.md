# Especificación: 20 - Ingreso solo por OAuth con puerta institucional UNSA

## 1. Objetivo
**Problema:** el modal de ingreso (`AuthModalHost.tsx`, no existe `LoginModal.tsx`) pedía el correo a mano y luego contraseña o registro. En Google solo se comprobaba que el correo terminara en `@unsa.edu.pe`, así que un Gmail personal con un alias `@unsa.edu.pe` verificado pasaba.
**Resultado esperado:**
- El modal solo ofrece "Continuar con Google (Correo UNSA)" y "Continuar con Apple".
- Google exige un correo verificado, el dominio exacto `@unsa.edu.pe` y una cuenta del Workspace UNSA (claim `hd`). Cualquier otro caso se rechaza con un mensaje claro.
- La sesión guarda el perfil del estudiante.

## 2. Fuera de alcance
- Los endpoints de clave (`/auth/login`, `/auth/register`, `/forgot`, `/reset`) y las páginas `Forgot`/`ResetPassword` se mantienen para cuentas existentes.
- `ALLOWED_EMAIL_EXCEPTIONS` (`@hub/shared`) sigue vigente. Es una decisión del propietario.
- No se añade el parámetro `hd` a la URL de Google. Filtraría el selector de cuentas y bloquearía esa excepción. La puerta real es el backend.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/src/modules/auth/oauth/identity.ts` | crear | `checkGoogleIdentity()` pura |
| `apps/api/src/modules/auth/oauth/identity.test.ts` | crear | 5 tests |
| `apps/api/src/modules/auth/oauth/google.ts` | modificar | usa la puerta; revoca el token y audita al denegar |
| `apps/api/src/modules/auth/oauth/session.ts` | modificar | `profile.upsert` en cada ingreso; avatar al día |
| `apps/web/src/components/AuthModalHost.tsx` | modificar | solo OAuth, aviso UNSA y términos |
| `apps/web/src/components/auth/OAuthButtons.tsx` | modificar | botones siempre visibles; toast si el proveedor no está configurado |
| `apps/web/src/pages/AuthCallback.tsx` | modificar | mensajes de error claros |
| `components/auth/{EmailStep,LoginForm,RegisterForm,AuthTabs,CareerPicker}.tsx`, `authErrors.ts` | eliminar | huérfanos |
| `docs/oauth.md` | modificar | regla `hd` |

## 4. Checklist de ejecución
- [x] T1: modal sin input de correo; botones "Continuar con Google (Correo UNSA)" y "Continuar con Apple".
- [x] T2: puerta Google: `email_verified`, `@unsa.edu.pe` y `hd = unsa.edu.pe`. Si falla: revoca el token, audita `auth.oauth.denied` y responde `EMAIL_NO_AUTORIZADO`.
- [x] T3: sesión. Crea o vincula el usuario, asegura el perfil (nombre del proveedor, universidad UNSA) y mantiene el avatar al día.
- [x] T4: typecheck, lint y test.

## 5. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | Tipos | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | Lint | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | Tests | ✅ | api 42 (+5 `identity.test.ts`), web 41, shared 34 |
| 2026-09-24 | Comportamiento | ✅ | Playwright a 1280 y 375 px: 0 inputs en el modal, solo los dos botones, toast "aún no disponible" sin credenciales, 0 errores de página |
