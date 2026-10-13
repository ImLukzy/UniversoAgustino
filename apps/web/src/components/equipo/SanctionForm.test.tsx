import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmModal } from "../ConfirmModal";
import { sanctionConfirmation } from "./SanctionForm";

describe("confirmación de sanciones", () => {
  it("muestra tipo, duración de suspensión y aviso antes de enviar", () => {
    const info = sanctionConfirmation("SUSPENSION", 7);
    const html = renderToStaticMarkup(<ConfirmModal info={info} busy={false} onConfirm={() => {}} onClose={() => {}} />);
    expect(html).toContain("¿Aplicar suspensión por 7 días?");
    expect(html).toContain("Se avisará a la persona sobre la suspensión por 7 días.");
    expect(html).toContain("Confirmar sanción");
  });
});
