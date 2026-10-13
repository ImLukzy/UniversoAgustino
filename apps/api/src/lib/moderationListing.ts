type ListingKind = "document" | "bazar";
type Notice = { userId: string; type: "PUBLICATION_REMOVED" | "PUBLICATION_RESTORED"; title: string; body: string; link: string };

export async function moderateListing(input: {
  id: string; kind: ListingKind; actorId: string; ownerId: string; removedAt: Date | null;
  legacyTakedown?: boolean; restore?: boolean; reason?: string;
  update: (data: Record<string, unknown>) => Promise<unknown>;
  audit: (action: string) => Promise<unknown>;
  notify: (notice: Notice) => Promise<unknown>;
}) {
  const restoring = input.restore === true;
  if (restoring && !input.removedAt && !input.legacyTakedown) return { status: 409 as const, code: "NOT_REMOVED" };
  if (restoring) {
    if (input.removedAt || input.legacyTakedown) {
      await input.update({ removedAt: null, removedReason: null, removedById: null, ...(input.legacyTakedown ? { status: "PUBLISHED" } : {}) });
      await input.audit("listing.restore");
      await input.notify({ userId: input.ownerId, type: "PUBLICATION_RESTORED", title: "Publicación restaurada", body: "Tu publicación volvió a estar disponible según su estado anterior.", link: "/publicaciones" });
    }
    return { status: 200 as const, data: { id: input.id, removedAt: null } };
  }
  if (input.removedAt) return { status: 200 as const, data: { id: input.id, removedAt: input.removedAt } };
  const removedAt = new Date();
  await input.update({ removedAt, removedReason: input.reason, removedById: input.actorId });
  await input.audit("listing.remove");
  await input.notify({ userId: input.ownerId, type: "PUBLICATION_REMOVED", title: "Tu publicación fue retirada", body: input.reason ?? "Tu publicación fue retirada por moderación.", link: "/publicaciones" });
  return { status: 200 as const, data: { id: input.id, removedAt } };
}
