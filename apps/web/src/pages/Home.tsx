import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/AppLayout";
import { StudocuHero } from "../components/home/StudocuHero";
import { HomeRecentDocs } from "../components/home/HomeRecentDocs";
import { HomeBazarRow } from "../components/home/HomeBazarRow";
import { api, type HubDocument } from "../lib/api";
import { useCareerTheme } from "../live/careerTheme";

// Home estilo Studocu: hero con buscador gigante + "Añadidos recientemente" + fila "Del Bazar".
export function Home() {
  const { career } = useCareerTheme();
  const [q, setQ] = useState("");

  const docs = useQuery({
    queryKey: ["home-docs", q, career],
    queryFn: async () => {
      const params: Record<string, unknown> = { pageSize: 12, page: 1, university: "UNSA" };
      if (q) params.q = q;
      if (career && career !== "all") params.career = career;
      return (await api.get("/documents", { params })).data as { data: HubDocument[]; total: number };
    },
    placeholderData: keepPreviousData,
  });

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-6xl bg-white">
        <StudocuHero onSearch={setQ} />
        <HomeRecentDocs docs={docs.data?.data ?? []} loading={docs.isLoading} searching={!!q} />
        {!q && <HomeBazarRow />}
      </div>
    </AppLayout>
  );
}
