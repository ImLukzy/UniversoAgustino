import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { API, api, check } from "./helper.mjs";

export async function uploadProof(token) {
  const form = new globalThis.FormData();
  form.set("purpose", "payment-proof");
  form.set("file", new globalThis.Blob([await readFile(resolve("tests/e2e/fixtures/payment-proof.png"))], { type: "image/png" }), "qa-sede-proof.png");
  const response = await globalThis.fetch(`${API}/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
  const result = await response.json();
  check(response.status === 201, `subida de comprobante sede: ${response.status}`);
  return result.data.url;
}

export async function futureSlot(token, caseId, kind) {
  const result = await api(`/staff/cases/${caseId}/slots?kind=${kind}`, { token });
  check(result.status === 200 && result.data.length > 0, `franjas ${kind} disponibles`);
  return result.data[0];
}

export async function book(token, caseId, kind, slot, previousId) {
  const suffix = previousId ? `/appointments/${previousId}/reschedule` : "/appointments";
  const result = await api(`/staff/cases/${caseId}${suffix}`, { token, method: "POST", body: { kind, sedeId: slot.sedeId, startsAt: slot.startsAt } });
  check(result.status === 201, `agendar ${kind}: ${result.status} ${result.error?.message ?? ""}`);
  return result.data;
}

export async function activateAppointment(db, id) {
  const now = new Date();
  await db.appointment.update({ where: { id }, data: { startsAt: new Date(now.getTime() - 60_000), endsAt: new Date(now.getTime() + 60_000) } });
}

export async function expireAppointment(db, id) {
  const now = new Date();
  await db.appointment.update({ where: { id }, data: { startsAt: new Date(now.getTime() - 120_000), endsAt: new Date(now.getTime() - 60_000) } });
}
