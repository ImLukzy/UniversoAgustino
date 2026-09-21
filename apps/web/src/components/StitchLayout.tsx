import type { ReactNode } from "react";
import { StitchHeader } from "./StitchHeader";
import { StitchFooter } from "./StitchFooter";

// Layout de páginas de cuenta (login, registro, cuenta, pedidos, admin):
// misma barra superior principal y mismo pie que el resto del sitio.
export function StitchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StitchHeader active={null} />
      <div className="pt-20 min-h-screen">{children}</div>
      <StitchFooter />
    </>
  );
}
