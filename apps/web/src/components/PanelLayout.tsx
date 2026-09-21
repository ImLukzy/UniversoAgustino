import type { ReactNode } from "react";
import { StitchHeader } from "./StitchHeader";
import { StitchFooter } from "./StitchFooter";
import { PanelTabs } from "./PanelTabs";

// Layout de la zona panel: barra superior principal + contenido con espacio
// para la barra inferior de módulos + pie del sitio.
export function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StitchHeader active={null} />
      <div className="bg-surface pb-24 pt-20 font-body-md text-body-md text-on-surface antialiased min-h-screen">
        {children}
      </div>
      <PanelTabs />
      <StitchFooter />
    </>
  );
}
