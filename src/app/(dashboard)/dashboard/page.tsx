import { Suspense } from "react";
import { StatsWidget } from "./_components/stats-widget";
import { StatsWidgetSkeleton } from "./_components/stats-widget-skeleton";
import { AcompanhamentosPendentesDashboard } from "./_components/acompanhamentos-pendentes";

export const metadata = {
  title: "Dashboard — Motochefe Nexus",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Visão geral do dia</h1>
        <p className="text-sm text-muted-foreground">Seus números de hoje e do mês.</p>
      </div>

      <Suspense fallback={<StatsWidgetSkeleton />}>
        <StatsWidget />
      </Suspense>

      <Suspense fallback={null}>
        <AcompanhamentosPendentesDashboard />
      </Suspense>
    </div>
  );
}
