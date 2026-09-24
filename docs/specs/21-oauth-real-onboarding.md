# Especificación: 21 - OAuth Google real (id_token verificado) y onboarding obligatorio

## 1. Objetivo
**Problema:** el callback de Google leía la identidad del endpoint userinfo con el access token y no validaba el `id_token` firmado. Además, una cuenta nueva quedaba con carrera Enfermería por defecto, sin facultad, ciclo ni celular.
**Resultado esperado:**
- "Continuar con Google" hace el flujo OAuth 2.0 real (authorization code + `client_secret`) en cuanto existan `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` en `.env`.
- El backend verifica el `id_token` de Google: firma RS256 contra el JWKS de Google, emisor, audiencia (nuestro client id) y vigencia. Luego aplica la puerta UNSA de la spec 20: `email_verified`, `@unsa.edu.pe` exacto y `hd`.
- En el primer ingreso se crea el usuario y se le lleva a `/bienvenida`, un perfil obligatorio. El correo aparece bloqueado. Se piden nombre y apellidos, facultad, carrera oficial (19), ciclo y celular.

## 2. Fuera de alcance
- Apple conserva su flujo (`id_token` por `form_post`); solo comparte el verificador genérico.
- La excepción `ALLOWED_EMAIL_EXCEPTIONS` sigue vigente (decisión del propietario).
- El bloqueo por perfil incompleto es de navegación (web). La API no rechaza otras rutas por perfil incompleto.
- Los perfiles existentes se marcan como completos en la migración para no bloquear a quien ya usaba la plataforma.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/src/lib/idToken.ts` | crear | `verifyIdToken()` RS256 + `jwksFetcher()` con caché de 24 h |
| `apps/api/src/lib/google.ts` / `google.test.ts` | crear | `verifyGoogleIdToken()`; 3 tests (firma, aud, exp, iss, Gmail) |
| `apps/api/src/lib/apple.ts` | modificar | usa `verifyIdToken` |
| `apps/api/src/modules/auth/oauth/{google,apple}.ts` | modificar | Google: identidad del `id_token`, revoca el token si falla |
| `apps/api/prisma/schema.prisma` + migración `20260926090000_profile_onboarding` | crear | `Profile.faculty`, `phone`, `onboardedAt` |
| `apps/api/src/modules/auth/routes.ts` | modificar | `POST /auth/onboarding` (una vez, 409 `PERFIL_COMPLETO`); `PATCH /profile` alinea la facultad |
| `packages/shared/src/onboarding.ts` / `.test.ts` | crear | `CAREER_FACULTY`, `UNSA_FACULTIES`, `CYCLES` (I–XIV), `OnboardingSchema`, celular peruano |
| `apps/web/src/pages/Bienvenida.tsx` | crear | pantalla de perfil obligatorio |
| `apps/web/src/components/onboarding/{OnboardingForm.tsx,useOnboarding.ts}` | crear | formulario y validación con el mismo esquema |
| `apps/web/src/app/{OnboardingGate,AppRoutes}.tsx` | crear / modificar | perfil pendiente → `/bienvenida?next=` |
| `apps/web/src/lib/{onboarding,authRedirect,routes,apiTypes,publishing}.ts` | crear / modificar | `careersOf()`; `/bienvenida` nunca es destino de retorno |
| `.env.example`, `docs/oauth.md` | modificar | variables de Google y flujo |

## 4. Checklist de ejecución
- [x] T1: OAuth real de Google. Canje del code con `client_secret`; identidad solo del `id_token` verificado (firma, iss, aud, exp).
- [x] T2: puerta estricta. `email_verified`, `@unsa.edu.pe` exacto y `hd`. Si falla: revoca el token, audita y responde `EMAIL_NO_AUTORIZADO`.
- [x] T3: primer ingreso. Crea el usuario; `onboardedAt` nulo lleva a `/bienvenida` desde cualquier ruta.
- [x] T4: formulario. Correo bloqueado; nombre completo (2+ palabras), facultad, carrera oficial de esa facultad (19), ciclo I–XIV y celular `9XXXXXXXX`, todo obligatorio. Validación compartida web/API.
- [x] T5: typecheck, lint, test, subset de iconos.

## 5. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | Tipos | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | Lint | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | Tests | ✅ | api 45 (+3 `google.test.ts`), web 44 (+3 `onboarding.test.ts`), shared 38 (+4 `onboarding.test.ts`) |
| 2026-09-24 | Migración | ✅ | `prisma migrate deploy`: `20260926090000_profile_onboarding` aplicada |
| 2026-09-24 | Comportamiento | ✅ | Playwright a 1280 y 375 px con una cuenta QA temporal (luego borrada). `/pedidos` → `/bienvenida?next=%2Fpedidos`; correo bloqueado; 5 errores al enviar vacío; Enfermería autoselecciona la carrera; al guardar vuelve a `/pedidos` y `/auth/me` trae facultad, ciclo, celular normalizado y `onboardedAt`; un segundo envío da 409; 0 px de scroll horizontal; 0 errores de página |
| 2026-09-24 | Iconos | ✅ | `subset-icons --check` OK (113) |
