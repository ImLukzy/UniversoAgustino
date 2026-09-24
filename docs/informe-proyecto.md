# Informe técnico del proyecto «Universo Agustino»

**Destinatarios:** estudiantes de la UNSA que financiaron el desarrollo
**Fecha:** 24 de septiembre de 2026
**Estado:** en producción en [www.universoagustino.site](https://www.universoagustino.site)

---

## 1. Resumen ejecutivo

**Universo Agustino** es una plataforma web hecha a la medida de la comunidad de la Universidad Nacional de San Agustín de Arequipa (UNSA). Solo pueden entrar personas con correo institucional `@unsa.edu.pe`, así que es un espacio cerrado y confiable para estudiantes.

**A quién beneficia**
- **Estudiantes que buscan material:** encuentran apuntes, guías, balotarios y resúmenes ordenados por facultad, carrera, curso y ciclo.
- **Estudiantes que crean material:** publican sus apuntes originales y cobran por ellos, con reglas claras de autoría (D.L. 822).
- **Toda la comunidad:** compra, vende o alquila libros, instrumental y uniformes entre compañeros.

**Qué problemas resuelve**

| Problema | Cómo lo resuelve la plataforma |
|---|---|
| Apuntes dispersos en grupos de WhatsApp, Drive y fotocopias | Catálogo único con buscador y filtros, vista previa gratuita de las páginas de muestra y visor protegido con marca de agua |
| Compra y venta entre estudiantes sin garantías | Bazar con pedidos registrados, comprobante de pago y **custodia**: el dinero queda retenido hasta que el comprador confirma que recibió el producto |
| Preparación desordenada para parciales, finales y admisión | Biblioteca de balotarios en «modo juego»: preguntas por facultad, marcador de aciertos y errores, y una explicación de cada respuesta |

---

## 2. Arquitectura y stack tecnológico (el «motor» de la web)

La plataforma tiene dos piezas independientes que se comunican por una API. Viven en un mismo repositorio (monorepo) y comparten las reglas de validación.

```
Navegador ──► Frontend (Vercel) ──HTTPS/JSON──► Backend API (Render) ──► PostgreSQL (Neon)
                                                      │
                                                      ├──► Archivos (Cloudflare R2)
                                                      ├──► Correo (Resend)
                                                      └──► Google OAuth 2.0
```

### 2.1 Frontend (lo que ves)
- **React 18 + TypeScript:** interfaz por componentes, con tipos estrictos que evitan errores antes de publicar.
- **Vite 5:** compila en segundos, recarga al instante durante el desarrollo y genera paquetes livianos. Cada página se carga solo cuando se visita.
- **Tailwind CSS:** un sistema de diseño propio (botones, tarjetas, campos) aplicado de forma consistente.
- **Diseño:**
  - **Referencias visuales:** la claridad de Linear, Notion y Studocu, con foco en los documentos académicos.
  - **Animaciones:** con física natural (framer-motion con resortes), en la línea de las pautas de Emil Kowalski.
  - **Pantalla estable:** **cero saltos de pantalla** (CLS ≈ 0): cada bloque reserva su espacio antes de cargar. Se verifica con pruebas en navegador a 1280 px y 375 px (móvil).
  - **Colores:** acento institucional **Teal `#00685F`** y tema de color por carrera.

### 2.2 Backend y base de datos (lo que no ves)
- **Node.js + Express + TypeScript:** una API REST que expone más de 60 operaciones documentadas en Swagger/OpenAPI.
- **Prisma ORM** sobre **PostgreSQL alojado en Neon**, con migraciones versionadas: 18 hasta hoy, aplicadas de forma controlada.
- **Zod:** valida todos los datos que entran, con las mismas reglas en el frontend y en el backend.

### 2.3 Seguridad, dominio y despliegue
- **Despliegue continuo:** cada cambio aprobado en GitHub se publica solo. El frontend va a **Vercel** y el backend a **Render**; las migraciones de la base se aplican con un comando controlado.
- **Dominio propio:** `universoagustino.site`, registrado en GoDaddy. La dirección sin `www` redirige a la versión canónica con `www`.
- **CORS estricto:** la API solo acepta peticiones de los orígenes exactos de la web; un dominio parecido pero distinto queda bloqueado.
- **Ingreso institucional:**
  - **Google OAuth 2.0:** implementación propia, sin librerías intermedias. El backend verifica la firma del token de Google y exige una cuenta del Workspace de la UNSA; un Gmail personal se rechaza y su token se revoca.
  - **Código de 6 dígitos al correo `@unsa.edu.pe`:** caduca en 10 minutos, admite 5 intentos y en la base se guarda cifrado, nunca en texto plano.
- **Correo transaccional con Resend:** el dominio está autenticado con registros DNS propios (DKIM y SPF), para que los correos no terminen en spam.
- **Sesión segura:**
  - un token de acceso de corta duración que vive solo en memoria;
  - un token de renovación en una cookie `httpOnly` que JavaScript no puede leer, se renueva en cada uso y se puede revocar.
- **Archivos:**
  - al subirlos, se verifica su tipo real (no solo la extensión) y se les da un nombre aleatorio;
  - se guardan en **Cloudflare R2**;
  - el visor muestra solo las páginas de muestra hasta que el pedido está pagado.

---

## 3. Justificación de ingeniería (nivel profesional vs. web improvisada)

### 3.1 ¿Por qué no WordPress o una plantilla?
Una plantilla resuelve una página informativa, pero no un sistema con pedidos, custodia de pagos, roles de moderación y reglas de acceso por dominio. En este proyecto:
- **Frontend y backend están separados:** cada parte escala, se despliega y se corrige por su cuenta, y una falla en una no tira a la otra.
- **Las reglas de negocio viven en el servidor:** el precio y la comisión se calculan allí, y los estados de un pedido solo pueden avanzar por transiciones permitidas. Manipular el navegador no altera nada.
- **Hay pruebas automáticas y controles de calidad en cada cambio:** 147 pruebas unitarias, verificación de tipos, lint, tamaño de archivos y que la documentación de la API coincida con las rutas reales.

### 3.2 Desafíos reales de producción que se resolvieron
| Desafío | Solución aplicada |
|---|---|
| La web y la API viven en dominios distintos y los navegadores bloquean las cookies entre sitios | La cookie de sesión es `SameSite=None; Secure` solo en producción. Como defensa contra peticiones falsificadas desde otros sitios, el origen de cada petición con cookie se compara de forma **exacta** con los permitidos |
| Detrás del proxy de Render todos los usuarios «tenían» la misma IP, y los límites de intentos los bloqueaban a todos | Configuración `trust proxy`, para leer la IP real del cliente |
| Vite incrusta la URL de la API al compilar: una variable faltante hacía que la web llamara a `localhost` | La variable `VITE_API_URL` se inyecta en el build de Vercel y hay un procedimiento de redespliegue sin caché |
| El dominio redirige a `www` y la API solo aceptaba el dominio sin `www` | Lista de orígenes permitidos con ambas variantes (`WEB_ORIGIN`) |
| El proveedor de correo rechazaba los envíos | Diagnóstico con el mensaje exacto del proveedor en los logs, verificación DNS del dominio y corrección del remitente |
| Dos flujos distintos para publicar apuntes, uno de ellos sin datos de cobro ni declaración legal | Un solo flujo (`/publicar`) que admite uno o varios archivos con las mismas garantías |

---

## 4. Estado actual y módulos desarrollados

| Módulo | Estado |
|---|---|
| Landing pública interactiva y responsiva (móvil y escritorio) | ✅ En producción |
| Ingreso con **Google** (cuenta UNSA) | ✅ En producción |
| Ingreso con **código de un solo uso** al correo `@unsa.edu.pe` | ✅ Implementado; el envío depende de la configuración final del remitente en Resend |
| Perfil obligatorio de bienvenida (facultad, carrera, ciclo, celular) | ✅ En producción |
| **Biblioteca de balotarios en modo juego:** 5 áreas (Salud, Ingenierías, Derecho, Económicas y Sociales) × 4 tipos (parcial, final, balotario, admisión) = 20 exámenes y 120 preguntas con explicación | ✅ En producción (`/balotarios`) |
| Catálogo de apuntes con vista previa, visor protegido y marca de agua | ✅ Implementado |
| Publicación de apuntes (uno o en lote) y de artículos del bazar | ✅ Implementado |
| Pedidos con cobro por Yape/Plin validado por el vendedor y **custodia** hasta la entrega | ✅ Implementado |
| Pasarela Mercado Pago (cobro automático con webhook firmado) | 🟡 Programada; se activa al configurar las credenciales |
| Reportes por derechos de autor (D.L. 822), moderación y notificaciones | ✅ Implementado |
| Ingreso con Apple | 🟡 Programado; requiere una cuenta de Apple Developer |

---

## 5. Hoja de ruta y escalabilidad

**Mejoras inmediatas**
1. **Ampliar el banco de preguntas por facultad.** Hoy son 120 preguntas en archivos del frontend. El siguiente paso es moverlas a la base de datos, con un panel de carga masiva y revisión docente.
2. **Activar Mercado Pago** para cobros automáticos sin validación manual.
3. **Rotar las credenciales** compartidas durante la puesta en marcha y cerrar la configuración del correo transaccional.

**Próximas fases**
- **Analítica de rendimiento:** historial de intentos por estudiante, percentil por curso y temas débiles.
- **PWA con modo sin conexión:** instalar la web en el celular y practicar balotarios sin internet.
- **Escalado:** caché compartida (Redis) para códigos de un solo uso y límites de intentos cuando haya varias instancias del servidor.

El almacenamiento en la nube (Cloudflare R2) y el bazar con custodia ya están construidos. No son fases futuras, sino módulos por ampliar según el uso real.

---

## 6. Valor de la plataforma y reconocimiento

Una plataforma a medida con esta infraestructura tiene un valor de mercado considerable. La estimación referencial del equipo es de **S/ 12 000 a S/ 20 000** si se encargara a una agencia de desarrollo. Incluye:
- frontend y backend separados;
- autenticación institucional en dos modalidades;
- pagos con custodia;
- almacenamiento seguro de archivos;
- dominio y correo autenticados;
- despliegue continuo y más de un centenar de pruebas automáticas.

El monto aportado por ustedes no cubre ese valor de mercado. Es un **aporte solidario**, y el trabajo restante se realizó con vocación de servicio a la comunidad agustina. Gracias a quienes creyeron en el proyecto: su apoyo hizo posible una herramienta hecha por y para estudiantes de la UNSA, que seguirá creciendo con sus sugerencias.

*Universo Agustino es una iniciativa estudiantil independiente, no afiliada oficialmente a la UNSA.*
