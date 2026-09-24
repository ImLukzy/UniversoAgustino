import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDebounce } from "../../lib/useDebounce";
import { SPRING } from "../../lib/motion";
import { ROUTES } from "../../lib/routes";

// Hero estilo Studocu: título masivo + buscador gigante rounded-full.
// Filtra en vivo (debounce 300 ms: sin una query por tecla) y Enter lleva al
// catálogo completo en /explorar?q=.
export function StudocuHero({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState("");
  const debounced = useDebounce(value, 300);
  const nav = useNavigate();

  useEffect(() => {
    onSearch(debounced.trim());
  }, [debounced, onSearch]);

  return (
    <section className="flex flex-col items-center px-4 pb-12 pt-10 text-center md:pt-16">
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="h-display max-w-3xl text-4xl md:text-6xl"
      >
        Estudia mejor con los apuntes de tu universidad
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="mt-4 max-w-xl text-base text-zinc-500 md:text-lg"
      >
        Apuntes, guías y balotarios compartidos por estudiantes de la UNSA.
      </motion.p>
      <motion.form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const t = value.trim();
          nav(t ? `${ROUTES.explore}?q=${encodeURIComponent(t)}` : ROUTES.explore);
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="mt-8 w-full max-w-2xl"
      >
        <label className="searchbar h-16 px-6 md:h-[4.5rem]">
          <span className="material-symbols-outlined text-2xl text-primary theme-transition" aria-hidden="true">search</span>
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Busca un curso, tema o documento"
            aria-label="Buscar documentos"
            className="md:text-lg"
          />
        </label>
      </motion.form>
    </section>
  );
}
