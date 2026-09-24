# Especificación: 01 - Restricción de Dominio Estricta y Refactorización Auth

## 1. Contexto y Objetivo
**Descripción:** El sistema actualmente permite el registro de usuarios, pero debemos aplicar una regla de negocio crítica: la plataforma es exclusiva de la Universidad Nacional de San Agustín (UNSA). Se debe restringir el registro y login (tanto por credenciales como futuro OAuth) estrictamente al dominio `@unsa.edu.pe`.
**Casos de Uso Principales:**
- Un estudiante de la UNSA puede registrarse con su correo institucional.
- Un usuario con un correo `@gmail.com` u otra universidad será rechazado con un mensaje de error claro (403 Forbidden).
- Se debe permitir una única excepción global (whitelist): `Lukas.melgar@tecsup.edu.pe`.

## 2. Modelado de Datos y Seguridad (Prisma + Express)
**Archivos Afectados:**
- `apps/api/src/modules/auth/account.ts` (registro y login) y `auth/oauth/{google,apple}.ts` (callbacks OAuth).
- `packages/shared/src/common.ts` (`isAllowedEmail`, `UnsaEmailSchema`) y `packages/shared/src/auth.ts` (`RegisterSchema`, `LoginSchema`).

**Lógica de Validación Centralizada:**
Se debe crear una función utilitaria en el backend para validar el dominio antes de tocar la base de datos (PostgreSQL).

```typescript
// Implementado en packages/shared/src/common.ts como isAllowedEmail()
export const isAllowedDomain = (email: string): boolean => {
  const normalizedEmail = email.toLowerCase().trim();
  if (normalizedEmail === 'lukas.melgar@tecsup.edu.pe') return true;
  return normalizedEmail.endsWith('@unsa.edu.pe');
}
```

## 3. UI y Rutas (Vite + React)
**Rutas/Componentes Afectados:**
- `apps/web/src/components/AuthModalHost.tsx`, `components/auth/EmailStep.tsx`, `LoginForm.tsx`, `RegisterForm.tsx` y `authErrors.ts`.

**Comportamiento del Cliente:**
- Validar el dominio en el frontend usando Zod (dentro del `shared` package si aplica, o en los esquemas del formulario) para dar feedback inmediato en la UI antes de enviar la petición a la API.
- Mostrar un `Toast` o mensaje de error en línea: "El acceso es exclusivo para correos institucionales @unsa.edu.pe".

## 4. Lógica de Backend
**EndPoints (Express):**
- `POST /api/v1/auth/register`: Interceptar la petición, validar el email con `isAllowedDomain`. Si falla, retornar `403 Forbidden` con código de error `AUTH_DOMAIN_RESTRICTED`.
- `POST /api/v1/auth/login`: Interceptar la petición. Si bien usuarios antiguos podrían tener otros correos, bloquear logins que no cumplan la regla a partir de ahora (para sanear la base de datos).
- *Preparación OAuth (WIP):* En el callback de Google OAuth, la misma validación debe ejecutarse antes de hacer `upsert` del usuario en Prisma.

## 5. Checklist de Tareas Granulares
*(Agente Opencode: Marca las tareas con `[x]` a medida que las completes)*

- [x] Tarea 1: Crear la función utilitaria `isAllowedDomain` en `apps/api/src/lib/` o carpeta equivalente.
- [x] Tarea 2: Actualizar la validación Zod en `packages/shared/` (o donde residan los contratos DTO) para incluir `.refine(isAllowedDomain, "Solo correos @unsa.edu.pe")` en el campo email del registro.
- [x] Tarea 3: Modificar el controlador de registro en `apps/api/src/modules/auth/` para rechazar explícitamente peticiones (Status 403) que evadan la validación del frontend.
- [x] Tarea 4: Modificar el controlador de login en `apps/api/src/modules/auth/` para aplicar la misma restricción de dominio.
- [x] Tarea 5: Actualizar los componentes de UI en `apps/web/src/components/auth/` para manejar y renderizar correctamente el mensaje de rechazo de dominio.
- [x] Tarea 6: Ejecutar las pruebas unitarias (Vitest) existentes para asegurar que el registro y el login siguen funcionando. *(Texto original truncado; completado en la auditoría.)*

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** La regla vive en `@hub/shared` (`isAllowedEmail` + `UnsaEmailSchema`) y no en `apps/api/src/lib/validators/`. La consumen el API (`account.ts`, `oauth/google.ts`, `oauth/apple.ts`) y la web (`EmailStep.tsx`). Tests en `packages/shared/src/auth.test.ts`.
- **Diferencia: código de error.** Se usa `EMAIL_NO_AUTORIZADO`, no `AUTH_DOMAIN_RESTRICTED`.
- **Diferencia: login.** Un correo ajeno se rechaza en la validación de `LoginSchema` (formato de error de validación, no un 403 explícito). El 403 solo se devuelve en el registro y en OAuth.
- **Rutas del texto original que no existen:** `auth.service.ts`, `auth.schema.ts` y `lib/validators/domain-validator.ts`. Ya están corregidas arriba.
