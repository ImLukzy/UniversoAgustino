// Formas sólidas tipo gota (sin blur) dispersas como en el hero de Studocu.
// Solo decoración: fuera del flujo, sin eventos y sin efecto en el layout.
const DROP = "50% 50% 50% 50% / 62% 62% 38% 38%";

const SHAPES = [
  { cls: "left-[-1.75rem] top-[22%] sm:left-[3%] sm:top-[20%] h-24 w-14 sm:h-36 sm:w-20 bg-[#a78bfa] rotate-[28deg]", r: DROP },
  { cls: "left-[3%] top-[56%] hidden h-14 w-11 sm:block bg-[#f97316] -rotate-12", r: "50%" },
  { cls: "left-[4%] bottom-[-3rem] h-24 w-16 sm:h-32 sm:w-20 bg-[#e858f0] -rotate-[35deg]", r: DROP },
  { cls: "right-[7%] top-[22%] h-6 w-6 sm:h-8 sm:w-8 bg-[#dcfc6b]", r: "50%" },
  { cls: "right-[3%] top-[47%] hidden h-32 w-14 sm:block bg-[#dbe8fe] rotate-[8deg]", r: "50% 50% 50% 50% / 40% 40% 60% 60%" },
  { cls: "right-[4%] bottom-[-1.5rem] h-10 w-40 bg-[#dcfc6b] -rotate-[28deg]", r: "100% 0 100% 0" },
];

export function HeroBlobs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {SHAPES.map((s) => (
        <div key={s.cls} className={`absolute ${s.cls}`} style={{ borderRadius: s.r }} />
      ))}
    </div>
  );
}
