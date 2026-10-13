type ActiveOrder = { status: string; expiresAt: Date | null };

type PauseChange = {
  id: string;
  actorId: string;
  ownerId: string;
  pausedAt: Date | null;
  resume: boolean;
  kind: "document" | "bazar";
  findActiveOrders: () => Promise<ActiveOrder[]>;
  update: (pausedAt: Date | null) => Promise<unknown>;
  audit: (action: string) => Promise<unknown>;
};

export async function changeListingPause(input: PauseChange) {
  if (input.actorId !== input.ownerId) return { status: 403 as const, code: "FORBIDDEN" as const };
  if (!input.resume && input.pausedAt === null) {
    const active = await input.findActiveOrders();
    if (active.length) {
      const statuses = [...new Set(active.map((order) => order.status))];
      const onlyPending = active.every((order) => order.status === "PENDING");
      return { status: 409 as const, code: "CONFLICT_ACTIVE_ORDERS" as const, details: {
        activeOrders: active.length,
        statuses,
        canForce: onlyPending,
        message: onlyPending ? "Hay una reserva activa. Podrás pausarla cuando expire o si la cancelas." : "Tiene pedidos en curso, no se puede pausar",
      } };
    }
  }
  const nextPausedAt = input.resume ? null : input.pausedAt ?? new Date();
  if (nextPausedAt !== input.pausedAt) {
    await input.update(nextPausedAt);
    await input.audit(`${input.kind}.${input.resume ? "resume" : "pause"}`);
  }
  return { status: 200 as const, data: { id: input.id, pausedAt: nextPausedAt } };
}
