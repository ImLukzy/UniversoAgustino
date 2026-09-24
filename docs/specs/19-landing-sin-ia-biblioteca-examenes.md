# Especificación: 19 - Landing sin IA y Biblioteca de Exámenes y Balotarios

## 1. Objetivo
**Problema:** la landing prometía funciones que no existen ni se construirán: "Modo IA" en el widget del hero y la fila "Nunca te pierdas nada de tus clases" (grabar clases y generar notas, `NotesMock`, etiqueta "Próximamente"). El quiz por área era genérico y su fila "Sin sorpresas el día del examen" (`ExamMock`) repetía la misma sección de práctica.
**Resultado esperado:** la landing solo cuenta lo que hace hoy la plataforma: descarga de resúmenes, parciales y finales (tras pago verificado), compra segura (Yape/Plin validado por el vendedor, Mercado Pago automático, custodia) y visor multidispositivo con marca de agua dinámica y prevención de capturas. La práctica pasa a ser la "Biblioteca de Exámenes y Balotarios UNSA": facultad → examen (curso, tipo, carrera) → preguntas con puntaje y explicación.

## 2. Fuera de alcance
- Persistir resultados o servir exámenes desde el backend: el repositorio es estático (`data/examLibrary.ts`) y crece añadiendo entradas.
- Las preguntas son de tipo examen por curso; no se atribuyen a un examen, año o docente concretos.
- `legal/CreatorTerms` ("¿Puedo transcribir grabaciones de clase?") se mantiene: es una regla de derechos de autor, no una función.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `data/quizzes.ts` | eliminar | reemplazado por la biblioteca |
| `data/examLibrary.ts` | crear | 5 facultades × 2 exámenes × 5 preguntas |
| `lib/quiz.test.ts` | modificar | valida la biblioteca (ids únicos, 5 por examen) |
| `components/landing/quiz/{ExamList,QuizPractice,QuizResult}.tsx` | crear / modificar | lista de exámenes; enlace a `/explorar?career=&q=curso` |
| `components/landing/LandingFeatures.tsx` | modificar | sección `#practica` = biblioteca |
| `components/landing/HeroWidgetCard.tsx` | modificar | sin "Modo IA"; widget rudo, accesos Parciales/Finales/Balotarios/Resúmenes |
| `components/landing/{FeatureRows,FeatureMocks}.tsx` | modificar | − `ExamMock`, `NotesMock`; + `PaymentMock` |
| `components/landing/{LandingHero,LandingDevices,DevicesMock,ChipTabs}.tsx` | modificar | textos reales; visor protegido |
| `apps/web/index.html` | modificar | subset de iconos (112) |

## 4. Checklist de ejecución
- [x] T1: eliminar "Modo IA", grabación de clases y sus mocks/huérfanos.
- [x] T2: `EXAM_LIBRARY` + `ExamList`; quiz por examen con enlace al material del curso.
- [x] T3: textos de valor real (descarga, pagos Yape/Plin/Mercado Pago, visor protegido).
- [x] T4: estética rudo en el widget del hero y los mocks.
- [x] T5: typecheck, lint, test, visual-regression.

## 5. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | Tipos | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | Lint | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | Tests | ✅ | api 37, web 41, shared 34 |
| 2026-09-24 | Visual / CLS | ✅ | `visual-regression.mjs` 22/22 |
| 2026-09-24 | Comportamiento | ✅ | Playwright 1280/375: sin "Modo IA"/"graba" en el texto; Derecho → Derecho Civil → respuesta con explicación; 0 px de scroll horizontal; 0 errores de página |
| 2026-09-24 | Iconos | ✅ | `subset-icons --check` OK (112) |
