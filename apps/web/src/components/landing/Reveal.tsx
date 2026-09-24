import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";


// Revela una sección al entrar en el viewport (una sola vez). Solo anima
// opacidad y transform: no altera el layout (CLS ≈ 0).
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ ...SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
