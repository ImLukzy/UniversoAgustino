import type { HubBazarItem, HubDocument } from "./apiTypes";

type Listing = HubDocument | HubBazarItem;

export function isActiveListing(item: Listing, kind: "document" | "bazar"): boolean {
  const expectedStatus = kind === "document" ? "PUBLISHED" : "AVAILABLE";
  return item.status === expectedStatus
    && item.paused !== true
    && !item.pausedAt
    && item.removed !== true
    && !item.removedAt
    && (item.reviewStatus === undefined || item.reviewStatus === "APPROVED");
}
