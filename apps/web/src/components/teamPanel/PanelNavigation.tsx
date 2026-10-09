import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { panelPath, visibleSections } from "./navigation";
export function PanelNavigation({ onAction }: { onAction?: () => void }) {
  const { user } = useAuth();
  const items = visibleSections(user?.role);
  const reviews = useQuery({ queryKey: ["staff", "review-count", user?.id], enabled: items.length > 0,
    queryFn: async () => (await api.get("/staff/reviews", { params: { pageSize: 1 } })).data as { pendingTotal: number }, refetchInterval: 30000 });
  const groups = [...new Set(items.map((s) => s.group))];
  return <nav aria-label="Secciones del panel" className="flex min-w-0 flex-col gap-3 py-3">
    {groups.map((group) => <div key={group}><p className="eyebrow mb-1 px-3">{group}</p><ul className="flex flex-col gap-0.5">
      {items.filter((s) => s.group === group).map((s) => <li key={s.slug}>
        <NavLink to={panelPath(s.slug)} onClick={onAction} className={({ isActive }) => `flex min-h-10 lg:min-h-9 min-w-0 items-center gap-3 rounded-lg px-3 py-1 text-sm font-semibold ${isActive ? "bg-primary-soft text-primary" : "text-zinc-700 hover:bg-zinc-100"}`}>
          <span className="material-symbols-outlined shrink-0 text-xl" aria-hidden="true">{s.icon}</span><span className="min-w-0 break-words">{s.label}</span>
          {s.slug === "publicaciones" && !!reviews.data?.pendingTotal && <span className="ml-auto shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">{reviews.data.pendingTotal}<span className="sr-only"> pendientes</span></span>}
        </NavLink>
      </li>)}
    </ul></div>)}
  </nav>;
}
