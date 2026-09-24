const COLUMNS = [
  {
    tone: "no",
    icon: "block",
    eyebrow: "Tolerancia cero",
    title: "Prohibido: material ajeno o evaluaciones oficiales",
    items: [
      ["Vender exámenes tomados por docentes", "Fotos o copias de parciales y rúbricas oficiales de la UNSA."],
      ["Usar el nombre o imagen del docente", "Títulos como “Examen resuelto del Dr. X” lesionan sus derechos morales."],
      ["PDFs de libros comerciales", "Escaneos de Elsevier, Panamericana o McGraw-Hill sin licencia."],
      ["Datos reales de pacientes", "Nombres, DNI o números de cama (Ley N° 29733)."],
    ],
  },
  {
    tone: "ok",
    icon: "task_alt",
    eyebrow: "Autoría propia",
    title: "Permitido: tu síntesis, tu obra",
    items: [
      ["Resúmenes, esquemas y mnemotecnias", "Fichas, mapas mentales y cuadros comparativos hechos por ti."],
      ["Preguntas de práctica redactadas por ti", "Casos ficticios con retroalimentación original."],
      ["Guías prácticas de rotación", "Orientación escrita por estudiantes para ciclos menores."],
      ["Citas con fuente", "Extractos breves con referencia (derecho de cita, D.L. 822)."],
    ],
  },
] as const;

// Matriz binaria "sí / no" con contenedores sólidos y marca de color por lado.
export function ComplianceMatrix() {
  return (
    <section className="border-y-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="eyebrow">Matriz de cumplimiento</p>
        <h2 className="h-display mt-2 max-w-3xl text-3xl sm:text-4xl">¿Qué puedes compartir y qué constituye falta grave?</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {COLUMNS.map((c) => (
            <div key={c.tone} className="card overflow-hidden">
              <div className={`flex items-center gap-3 border-b-2 border-zinc-900 px-6 py-4 ${c.tone === "no" ? "bg-[#fee2e2]" : "bg-[#dcfce7]"}`}>
                <span className={`material-symbols-outlined text-2xl ${c.tone === "no" ? "text-[#b91c1c]" : "text-[#15803d]"}`}>{c.icon}</span>
                <div>
                  <p className="eyebrow text-zinc-700">{c.eyebrow}</p>
                  <h3 className="font-extrabold text-zinc-950">{c.title}</h3>
                </div>
              </div>
              <ul className="divide-y divide-dashed divide-zinc-300">
                {c.items.map(([t, d]) => (
                  <li key={t} className="px-6 py-4">
                    <p className="font-bold text-zinc-900">{t}</p>
                    <p className="mt-0.5 text-sm text-zinc-600">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
