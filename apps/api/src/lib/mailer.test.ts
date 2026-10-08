import { afterEach, describe, expect, it, vi } from "vitest";
import { mailer } from "./mailer.js";
afterEach(() => { vi.restoreAllMocks(); delete process.env.MAIL_DRIVER; });
describe("sendNotice", () => {
  it("escapa HTML del texto y del enlace (driver consola)", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await mailer.sendNotice("a@unsa.edu.pe", "Cita", "<script>x</script>", "https://x.pe/a?b=\"1\"");
    const line = String(log.mock.calls[0]?.[0]);
    expect(line).toContain("&lt;script&gt;");
    expect(line).not.toContain("<script>");
    expect(line).toContain("&quot;1&quot;");
  });
});
