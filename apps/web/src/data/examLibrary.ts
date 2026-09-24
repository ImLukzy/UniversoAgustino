import type { Career } from "@hub/shared";
import type { QuizQuestion } from "../lib/quiz";

// Biblioteca de Exámenes y Balotarios UNSA (spec 19): repositorio estático de
// preguntas tipo examen por facultad y curso, con la explicación que se
// muestra al responder. Para sumar un examen basta con añadir una entrada.
export type ExamKind = "Parcial" | "Final" | "Balotario";

export interface Exam {
  id: string;
  course: string;
  career: Career;
  kind: ExamKind;
  questions: QuizQuestion[];
}

export interface Faculty {
  label: string;
  exams: Exam[];
}

export const EXAM_LIBRARY: Faculty[] = [
  {
    label: "Salud",
    exams: [
      { id: "fund-enf", course: "Fundamentos de Enfermería", career: "ENFERMERIA", kind: "Parcial", questions: [
        { q: "¿Signo temprano del shock hipovolémico?", opts: ["Taquicardia", "Bradicardia", "Hipertensión", "Poliuria"], ok: 0, why: "El corazón compensa la pérdida de volumen acelerando la frecuencia antes de que caiga la presión." },
        { q: "¿Primera etapa del Proceso de Atención de Enfermería?", opts: ["Diagnóstico", "Valoración", "Planificación", "Evaluación"], ok: 1, why: "El PAE empieza por la valoración: recoger datos del paciente para después diagnosticar." },
        { q: "Frecuencia respiratoria normal en un adulto en reposo:", opts: ["6–10 rpm", "25–30 rpm", "12–20 rpm", "30–40 rpm"], ok: 2, why: "Entre 12 y 20 respiraciones por minuto es el rango normal del adulto." },
        { q: "¿Qué vía tiene el inicio de acción más rápido?", opts: ["Oral", "Intramuscular", "Subcutánea", "Intravenosa"], ok: 3, why: "La vía intravenosa entrega el fármaco directo a la circulación, sin absorción." },
        { q: "¿Qué escala valora el nivel de conciencia?", opts: ["Glasgow", "Braden", "Norton", "Apgar"], ok: 0, why: "Glasgow puntúa apertura ocular, respuesta verbal y motora (de 3 a 15)." },
      ] },
      { id: "anatomia", course: "Anatomía Humana", career: "MEDICINA", kind: "Balotario", questions: [
        { q: "¿Qué hueso forma el talón?", opts: ["Calcáneo", "Astrágalo", "Cuboides", "Navicular"], ok: 0, why: "El calcáneo es el hueso más grande del tarso y forma el talón." },
        { q: "¿Cuántos pares de nervios craneales hay?", opts: ["10", "12", "31", "8"], ok: 1, why: "Son 12 pares craneales; los nervios raquídeos son 31 pares." },
        { q: "¿Hueso más largo del cuerpo humano?", opts: ["Húmero", "Tibia", "Fémur", "Peroné"], ok: 2, why: "El fémur, en el muslo, es el hueso más largo y resistente." },
        { q: "¿Qué órgano produce la insulina?", opts: ["Hígado", "Riñón", "Bazo", "Páncreas"], ok: 3, why: "La secretan las células beta de los islotes de Langerhans del páncreas." },
        { q: "¿Qué válvula separa la aurícula y el ventrículo izquierdos?", opts: ["Tricúspide", "Mitral", "Pulmonar", "Aórtica"], ok: 1, why: "La mitral (bicúspide) está en el lado izquierdo; la tricúspide, en el derecho." },
      ] },
    ],
  },
  {
    label: "Ingenierías",
    exams: [
      { id: "algoritmos", course: "Algoritmos y Estructuras de Datos", career: "ING_SISTEMAS", kind: "Parcial", questions: [
        { q: "¿Complejidad de la búsqueda binaria?", opts: ["O(n)", "O(log n)", "O(n²)", "O(1)"], ok: 1, why: "Cada paso descarta la mitad del arreglo ordenado: log₂(n) pasos." },
        { q: "¿Qué estructura sigue el orden LIFO?", opts: ["Cola", "Árbol", "Grafo", "Pila"], ok: 3, why: "En una pila el último elemento en entrar es el primero en salir." },
        { q: "¿Qué estructura usa el recorrido BFS?", opts: ["Cola", "Pila", "Montículo", "Tabla hash"], ok: 0, why: "BFS visita por niveles: encola los vecinos y los procesa en orden de llegada." },
        { q: "Complejidad de Merge Sort en el peor caso:", opts: ["O(n)", "O(n²)", "O(n log n)", "O(log n)"], ok: 2, why: "Divide en mitades (log n niveles) y mezcla en O(n) por nivel." },
        { q: "Máximo de nodos de un árbol binario de altura h (raíz en 0):", opts: ["2h", "h²", "2^h", "2^(h+1) − 1"], ok: 3, why: "Cada nivel i aporta 2^i nodos; la suma de 0 a h es 2^(h+1) − 1." },
      ] },
      { id: "calculo-fisica", course: "Cálculo y Física I", career: "ING_CIVIL", kind: "Final", questions: [
        { q: "La derivada de sen(x) es:", opts: ["−sen(x)", "−cos(x)", "cos(x)", "tan(x)"], ok: 2, why: "d/dx sen(x) = cos(x); la de cos(x) es −sen(x)." },
        { q: "Unidad de fuerza en el Sistema Internacional:", opts: ["Newton", "Joule", "Pascal", "Watt"], ok: 0, why: "1 N = 1 kg·m/s². El joule mide energía y el pascal, presión." },
        { q: "∫ 2x dx =", opts: ["2x² + C", "x² + C", "x + C", "2 + C"], ok: 1, why: "La antiderivada de 2x es x², más la constante de integración." },
        { q: "Un concreto f'c = 210 kg/cm² indica su resistencia a…", opts: ["Tracción", "Compresión", "Corte", "Flexión"], ok: 1, why: "f'c es la resistencia a la compresión a los 28 días." },
        { q: "Valor aproximado de la gravedad en la Tierra:", opts: ["6,67 m/s²", "8,9 m/s²", "10,8 m/s²", "9,81 m/s²"], ok: 3, why: "g ≈ 9,81 m/s² a nivel del mar; 6,67 es la constante G (×10⁻¹¹)." },
      ] },
    ],
  },
  {
    label: "Derecho",
    exams: [
      { id: "constitucional", course: "Derecho Constitucional", career: "DERECHO", kind: "Parcial", questions: [
        { q: "¿Norma de mayor jerarquía en el Perú?", opts: ["Ley orgánica", "Decreto supremo", "Constitución", "Ordenanza"], ok: 2, why: "El art. 51 de la Constitución establece su prevalencia sobre toda norma legal." },
        { q: "¿Qué proceso protege la libertad individual?", opts: ["Hábeas corpus", "Hábeas data", "Amparo", "Cumplimiento"], ok: 0, why: "El hábeas corpus tutela la libertad individual y los derechos conexos." },
        { q: "¿Quién promulga las leyes aprobadas por el Congreso?", opts: ["El Tribunal Constitucional", "El Presidente de la República", "El Poder Judicial", "El JNE"], ok: 1, why: "El Presidente promulga la ley o la observa dentro de 15 días hábiles." },
        { q: "¿Qué proceso protege el acceso a la información pública?", opts: ["Amparo", "Acción popular", "Hábeas corpus", "Hábeas data"], ok: 3, why: "El hábeas data (art. 200.3) tutela el acceso a la información pública y a los datos personales." },
        { q: "¿Quién es el intérprete supremo de la Constitución?", opts: ["El Tribunal Constitucional", "La Corte Suprema", "El Congreso", "La Defensoría del Pueblo"], ok: 0, why: "Así lo establece el art. 1 de la Ley Orgánica del Tribunal Constitucional." },
      ] },
      { id: "civil", course: "Derecho Civil", career: "DERECHO", kind: "Final", questions: [
        { q: "Mayoría de edad civil en el Perú:", opts: ["16 años", "21 años", "17 años", "18 años"], ok: 3, why: "El art. 42 del Código Civil fija la plena capacidad a los 18 años." },
        { q: "El acto jurídico requiere, entre otros:", opts: ["Agente capaz", "Escritura pública siempre", "Testigos", "Registro"], ok: 0, why: "El art. 140 del Código Civil exige agente capaz, objeto posible, fin lícito y forma prescrita." },
        { q: "La persona humana es sujeto de derecho desde…", opts: ["Los 18 años", "Su nacimiento", "Su inscripción en RENIEC", "Los 16 años"], ok: 1, why: "Art. 1 del Código Civil; el concebido lo es para todo cuanto le favorece." },
        { q: "La acción personal prescribe a los…", opts: ["2 años", "5 años", "10 años", "20 años"], ok: 2, why: "Art. 2001, inc. 1 del Código Civil: diez años." },
        { q: "Por regla general, los contratos se perfeccionan con…", opts: ["La entrega del bien", "El pago total", "La escritura pública", "El consentimiento"], ok: 3, why: "Art. 1352: basta el consentimiento, salvo los que exigen una forma bajo sanción de nulidad." },
      ] },
    ],
  },
  {
    label: "Económicas",
    exams: [
      { id: "micro", course: "Microeconomía", career: "ECONOMIA", kind: "Parcial", questions: [
        { q: "Si sube el precio, la cantidad demandada…", opts: ["Sube", "No cambia", "Se duplica", "Baja"], ok: 3, why: "Ley de la demanda: precio y cantidad demandada se mueven en sentido contrario." },
        { q: "El PBI mide…", opts: ["Solo exportaciones", "El valor de bienes y servicios finales producidos", "La deuda pública", "La inflación"], ok: 1, why: "El PBI suma el valor de mercado de la producción final de un país en un periodo." },
        { q: "Un bien sustituto del café es…", opts: ["El azúcar", "La taza", "El té", "La leche"], ok: 2, why: "Los sustitutos satisfacen la misma necesidad; el azúcar es un complemento." },
        { q: "¿Qué mide la inflación?", opts: ["El aumento sostenido del nivel general de precios", "El desempleo", "El tipo de cambio", "La tasa de interés"], ok: 0, why: "En el Perú se mide con el IPC de Lima Metropolitana." },
        { q: "Si la elasticidad precio de la demanda es mayor que 1, la demanda es…", opts: ["Inelástica", "Elástica", "Unitaria", "Perfectamente inelástica"], ok: 1, why: "La cantidad reacciona en mayor proporción que el precio." },
      ] },
      { id: "contabilidad", course: "Contabilidad General", career: "CONTABILIDAD", kind: "Final", questions: [
        { q: "La ecuación contable básica es:", opts: ["Activo = Pasivo + Patrimonio", "Activo = Ingresos − Gastos", "Pasivo = Activo + Patrimonio", "Patrimonio = Ventas"], ok: 0, why: "Todo lo que la empresa tiene se financia con deudas o con aportes propios." },
        { q: "Una cuenta de activo aumenta por el…", opts: ["Haber", "Debe", "Saldo acreedor", "Patrimonio"], ok: 1, why: "Las cuentas de activo se cargan (debe) al aumentar y se abonan (haber) al disminuir." },
        { q: "Tasa del IGV en el Perú (incluido el IPM):", opts: ["16 %", "19 %", "18 %", "12 %"], ok: 2, why: "16 % de IGV más 2 % de Impuesto de Promoción Municipal." },
        { q: "¿Qué estado financiero muestra la utilidad del periodo?", opts: ["Balance general", "Flujo de efectivo", "Cambios en el patrimonio", "Estado de resultados"], ok: 3, why: "El estado de resultados resta costos y gastos a los ingresos del periodo." },
        { q: "La depreciación reconoce…", opts: ["El desgaste del activo fijo en el tiempo", "La caída del tipo de cambio", "Las cuentas incobrables", "La inflación"], ok: 0, why: "Distribuye el costo del activo fijo a lo largo de su vida útil." },
      ] },
    ],
  },
  {
    label: "Sociales",
    exams: [
      { id: "desarrollo", course: "Psicología del Desarrollo", career: "PSICOLOGIA", kind: "Parcial", questions: [
        { q: "¿Quién propuso las etapas del desarrollo cognitivo?", opts: ["Freud", "Piaget", "Skinner", "Maslow"], ok: 1, why: "Piaget describió cuatro etapas: sensoriomotora, preoperacional, operaciones concretas y formales." },
        { q: "En la pirámide de Maslow, la base son las necesidades…", opts: ["De autorrealización", "Sociales", "De estima", "Fisiológicas"], ok: 3, why: "Las necesidades fisiológicas (comer, dormir) son la base de la jerarquía." },
        { q: "La 'zona de desarrollo próximo' es un concepto de…", opts: ["Vygotsky", "Bandura", "Pavlov", "Erikson"], ok: 0, why: "Vygotsky la definió como lo que el alumno logra con ayuda de otro más capaz." },
        { q: "El condicionamiento clásico se asocia a…", opts: ["Rogers", "Piaget", "Pavlov", "Jung"], ok: 2, why: "Pavlov lo demostró con la salivación de perros ante un estímulo condicionado." },
        { q: "Según Erikson, la crisis de la adolescencia es…", opts: ["Confianza vs. desconfianza", "Identidad vs. confusión de rol", "Integridad vs. desesperación", "Intimidad vs. aislamiento"], ok: 1, why: "El adolescente busca definir quién es y qué papel ocupa." },
      ] },
      { id: "investigacion", course: "Investigación Educativa", career: "EDUCACION", kind: "Balotario", questions: [
        { q: "Una muestra aleatoria sirve para…", opts: ["Elegir solo voluntarios", "Que todos tengan la misma probabilidad de ser elegidos", "Evitar el consentimiento", "Aumentar el sesgo"], ok: 1, why: "El muestreo aleatorio reduce el sesgo de selección." },
        { q: "La variable que el investigador manipula es la…", opts: ["Independiente", "Dependiente", "Interviniente", "De control"], ok: 0, why: "La independiente es la causa supuesta; la dependiente, el efecto que se mide." },
        { q: "¿Qué evaluación explora los saberes previos al inicio?", opts: ["Sumativa", "Formativa", "Diagnóstica", "Final"], ok: 2, why: "La diagnóstica ubica al estudiante antes de empezar la unidad." },
        { q: "El aprendizaje significativo es una propuesta de…", opts: ["Watson", "Thorndike", "Skinner", "Ausubel"], ok: 3, why: "Ausubel: se aprende al relacionar lo nuevo con lo que ya se sabe." },
        { q: "La hipótesis nula (H₀) afirma que…", opts: ["Hay diferencia significativa", "No hay efecto ni diferencia", "La muestra está sesgada", "La relación es causal"], ok: 1, why: "La prueba estadística busca evidencia para rechazar H₀." },
      ] },
    ],
  },
];
