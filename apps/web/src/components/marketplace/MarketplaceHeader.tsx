import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  resultCount?: number;
  careerLabel?: string;
};

export function MarketplaceHeader({ query, onQueryChange, onSubmit, resultCount, careerLabel }: Props) {
  return (
    <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="border-b-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-8">
        <p className="eyebrow">{careerLabel ?? "Toda la comunidad UNSA"}</p>
        <h1 className="h-display mt-2 text-3xl sm:text-4xl">Explora el catálogo</h1>
        <p className="mt-1 min-h-[1.25rem] text-sm text-zinc-600">
          Apuntes y productos del Bazar de tu comunidad agustina
          {typeof resultCount === "number" && ` · ${resultCount} recursos`}
        </p>
        <form
          role="search"
          className="searchbar mt-5 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <span className="material-symbols-outlined text-zinc-500" aria-hidden="true">search</span>
          <input value={query} onChange={(e) => onQueryChange(e.target.value)} aria-label="Buscar" placeholder="Buscar por título, curso o palabra clave…" />
          <button type="submit" className="btn btn-dark btn-sm">Buscar</button>
        </form>
      </div>
    </motion.header>
  );
}
