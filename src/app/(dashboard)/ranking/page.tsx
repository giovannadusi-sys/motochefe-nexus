import { Suspense } from "react";
import { RankingList } from "./_components/ranking-list";
import { RankingListSkeleton } from "./_components/ranking-list-skeleton";

export const metadata = { title: "Ranking — Motochefe Nexus" };

export default function RankingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          Classificação da unidade Piratininga por valor vendido este mês.
        </p>
      </div>

      <Suspense fallback={<RankingListSkeleton />}>
        <RankingList />
      </Suspense>
    </div>
  );
}
