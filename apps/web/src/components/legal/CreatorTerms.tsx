import { PLATFORM_FEE_PCT } from "@hub/shared";
import { Accordion } from "../Accordion";

const CLAUSES = [
  { title: "Originalidad y derechos morales", body: "Conservas la autoría de tus obras. Al publicar declaras haber redactado tus resúmenes y esquemas sin copia ni plagio.", ref: "D.L. 822" },
  { title: "Licencia no exclusiva", body: "Autorizas a Universo Agustino a alojar y vender tu documento; puedes retirarlo y publicarlo en otros medios cuando quieras.", ref: "Revocable" },
  { title: "Sin sellos institucionales", body: "No uses logotipos o sellos oficiales de la UNSA, EsSalud o MINSA sin autorización: identifica tu material como apunte independiente.", ref: "Uso de marca" },
  { title: "Retiro en menos de 48 horas", body: "Si un docente, autor o institución reporta una infracción con sustento, el material se retira de forma preventiva mientras se revisa.", ref: "Notice & takedown" },
];

const MORE = [
  { id: "precios", icon: "price_change", title: "Precios y comisión", body: <p>{`Tú fijas el precio. La plataforma retiene el ${PLATFORM_FEE_PCT}% y el resto es tuyo; el monto se congela al reservar el pedido.`}</p> },
  { id: "datos", icon: "fingerprint", title: "Casos clínicos anonimizados", body: <p>Nunca incluyas nombres, DNI ni números de cama de pacientes reales (Ley N° 29733 de Protección de Datos Personales).</p> },
  { id: "cita", icon: "menu_book", title: "¿Puedo citar NANDA, dosis o guías del MINSA?", body: <p>Sí, con fines docentes y citando la fuente. Lo que no puedes es copiar capítulos enteros de manuales comerciales sin aporte propio.</p> },
  { id: "clases", icon: "mic", title: "¿Puedo transcribir grabaciones de clase?", body: <p>No de forma literal: la clase magistral es obra del docente. Sí puedes redactar con tus palabras lo aprendido y ordenarlo en tu propio material.</p> },
  { id: "impuestos", icon: "receipt_long", title: "¿Debo declarar mis ingresos?", body: <p>Los ingresos por tus apuntes son tuyos y pueden estar sujetos a obligaciones tributarias. Consulta tu caso con SUNAT o un contador.</p> },
];

// Pacto del creador: 4 cláusulas clave en tarjetas + detalle en acordeón.
export function CreatorTerms() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <p className="eyebrow">Pacto de confianza estudiantil</p>
      <h2 className="h-display mt-2 max-w-3xl text-3xl sm:text-4xl">Términos para estudiantes creadores</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {CLAUSES.map((c, i) => (
          <li key={c.title} className="card flex flex-col p-6">
            <span className="price text-3xl text-primary theme-transition">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-extrabold text-zinc-950">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{c.body}</p>
            <span className="tag mt-4 w-fit">{c.ref}</span>
          </li>
        ))}
      </ol>
      <div className="mt-12 max-w-3xl">
        <Accordion items={MORE} />
      </div>
    </section>
  );
}
