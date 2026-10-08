import { fmtDate, type HubNotification } from "../../lib/api";
import { notificationGroup } from "./groups";

export function NotificationList({ rows, open }: { rows: HubNotification[]; open: (n: HubNotification) => void }) {
  const groups = new Map<string, HubNotification[]>();
  for (const row of rows) {
    const group = notificationGroup(row.createdAt);
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }
  return <div className="flex min-w-0 flex-col gap-6">{Array.from(groups, ([label, items]) =>
    <section key={label} aria-label={label}>
      <h2 className="mb-3 font-bold">{label}</h2>
      <ul className="flex flex-col gap-3">{items.map((n) => <li key={n.id}>
        <button type="button" onClick={() => open(n)} className={`card card-hover flex w-full min-w-0 flex-col gap-2 p-4 text-left ${n.readAt ? "" : "bg-primary-soft"}`}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-words font-extrabold text-zinc-950">{n.title}</span>
            <span className="text-xs text-zinc-500">{fmtDate(n.createdAt)}</span>
          </span>
          {!n.readAt && <span className="text-xs font-bold text-primary">No leída</span>}
          <span className="break-words text-sm text-zinc-600">{n.body}</span>
        </button>
      </li>)}</ul>
    </section>
  )}</div>;
}
