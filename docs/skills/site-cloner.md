# SKILL: Site Cloner & Token Extractor
**Cuándo usar:** Al replicar o inspirarte en una interfaz visual (referencias exactas, HTML inspeccionado o tokens extraídos).

## Reglas de Ejecución:
1. **Extracción de tokens → Tailwind:** Mide colores, padding, radios, sombras y anchos máximos de la referencia y tradúcelos a clases oficiales de Tailwind (valores arbitrarios `[#hex]`, `[3rem]` solo cuando la escala no alcance).
2. **Tokens del proyecto:** Respeta las variables globales (`--hub-p*`) en la app; solo la landing pública independiente puede fijar colores de marca.
3. **Modularidad estricta:** Ningún componente JSX/TSX supera 150 líneas. Divide secciones complejas en subcomponentes (`HeroWidgetCard`, `HeroBlobs`, etc.).
4. **Tipografía refinada:**
   - Escala limpia: H1 `text-5xl/6xl`, H2 `text-4xl/5xl`, H3 `text-2xl/3xl`, cuerpo `text-base/lg`.
   - Jerarquía con `font-display` (Plus Jakarta Sans) en titulares; cuerpo en Inter.
   - Titulares `font-extrabold tracking-tight` con interlineado ajustado (`leading-[1.05]`–`leading-tight`) y `text-balance`; cuerpo `leading-relaxed`, ancho de lectura `max-w-xl`–`max-w-2xl`.
   - Contraste nítido: titulares `text-zinc-900`, secundarios `text-zinc-500/600`.
5. **Framer Motion:** Transiciones `type: "spring", stiffness: 400, damping: 30` en elementos interactivos, pestañas (`layoutId`) y entradas visibles (`whileInView`, `once: true`).
6. **Zero Layout Shift:** Anima solo `opacity`/`transform`; reserva altura en contenidos que cambian (pestañas, cargas asíncronas, validaciones).
7. **Interactividad real:** Todo botón lleva a una ruta de `ROUTES` o al modal de registro; nada de enlaces muertos ni funciones falsas sin etiqueta "Próximamente".
