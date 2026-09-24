import { Reveal } from "./Reveal";
import { DevicesMock } from "./DevicesMock";

const POINTS = [
  { icon: "devices", title: "En el celular y la laptop", body: "Tus compras quedan en Mis pedidos: léelas o descárgalas desde cualquier dispositivo." },
  { icon: "water_drop", title: "Marca de agua dinámica", body: "Cada página muestra el nombre y parte del correo de quien lee, con fecha y hora." },
  { icon: "visibility_off", title: "Prevención de capturas", body: "El visor oculta el documento ante atajos de captura, impresión o al cambiar de ventana." },
];

// Multidispositivo + visor protegido (specs 16, 17 y 19) en estética rudo: panel primary-soft con borde
// zinc-900 y sombra dura; tarjetas .card para cada ventaja.
export function LandingDevices() {
  return (
    <section className="bg-white px-4 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-6xl">
        <div
          className="panel grid items-center gap-10 bg-primary-soft px-5 py-12 sm:px-10 md:grid-cols-[1.1fr_1fr] md:py-14"
        >
          <div>
            <span className="tag bg-white">Multidispositivo</span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.5rem]">
              Tus apuntes en todos tus dispositivos, siempre protegidos
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-700">
              En el micro, en la guardia o en la biblioteca, con un visor que protege el trabajo de cada autor.
            </p>
            <ul className="mt-7 grid gap-3">
              {POINTS.map((p) => (
                <li key={p.title} className="card flex items-start gap-3 p-4">
                  <span aria-hidden="true" className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary text-xl text-primary-ink">
                    {p.icon}
                  </span>
                  <span>
                    <b className="block text-zinc-950">{p.title}</b>
                    <span className="text-sm text-zinc-600">{p.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">send_to_mobile</span>
              Tip: desde el menú del navegador, añádela a tu pantalla de inicio.
            </p>
          </div>
          <DevicesMock />
        </div>
      </Reveal>
    </section>
  );
}
