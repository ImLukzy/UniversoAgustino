import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export function Cuenta() {
  const { user, logout } = useAuth();
  const payouts = useQuery({
    queryKey: ["payouts-mine"],
    queryFn: async () => (await api.get("/monetization/payouts/mine")).data.data as Array<{ id: string; period: string; grossCents: number; feeCents: number; netCents: number; status: string }>,
    enabled: !!user,
  });

  if (!user)
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-teal-700 underline" to="/login">entrar</Link> para ver tu cuenta.
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <div className="card p-6">
        <h1 className="font-display text-2xl font-extrabold">Mi cuenta</h1>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-500">Nombre</dt><dd>{user.profile?.fullName ?? "—"}</dd></div>
          <div><dt className="font-semibold text-slate-500">Email</dt><dd>{user.email}</dd></div>
          <div><dt className="font-semibold text-slate-500">Universidad</dt><dd>{user.profile?.university ?? "—"}</dd></div>
          <div><dt className="font-semibold text-slate-500">Ciclo</dt><dd>{user.profile?.cycle ?? "—"}</dd></div>
          <div><dt className="font-semibold text-slate-500">Rol</dt><dd><span className="badge-uni">{user.role}</span></dd></div>
          <div><dt className="font-semibold text-slate-500">ID (Postgres User.id)</dt><dd className="break-all text-xs">{user.id}</dd></div>
        </dl>
        <button onClick={logout} className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
          Cerrar sesión
        </button>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold">Mis payouts</h2>
        {payouts.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
        {payouts.isError && <p className="text-sm text-red-600">No se pudo cargar (¿sesión expirada?).</p>}
        {payouts.data?.length === 0 && <p className="text-sm text-slate-500">Aún sin payouts. Publica apuntes y vende en bazar.</p>}
        <ul className="mt-2 space-y-2">
          {payouts.data?.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold">{p.period}</span>
              <span>S/ {(p.grossCents / 100).toFixed(2)} bruto · S/ {(p.netCents / 100).toFixed(2)} neto</span>
              <span className="badge-cep">{p.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
