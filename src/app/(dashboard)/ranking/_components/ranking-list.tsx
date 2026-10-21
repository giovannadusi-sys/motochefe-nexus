import { Trophy, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const CORES_POSICAO: Record<number, string> = {
  1: "text-warning",
  2: "text-muted-foreground",
  3: "text-[#b45309]",
};

/**
 * Ranking do mês atual — chama a função `ranking_mensal_unidade()`
 * (RPC, SECURITY DEFINER) em vez de consultar a view diretamente.
 * Ver comentário na migration 20260824000006 para o porquê: a RLS de
 * `vendas` faria os colegas sumirem do agregado para um vendedor
 * comum, o que quebraria a regra confirmada (ranking é visível para
 * todos da unidade).
 */
export async function RankingList() {
  const supabase = await createClient();
  const { data: ranking, error } = await supabase.rpc("ranking_mensal_unidade");

  if (error) {
    return (
      <EmptyState
        icon={Trophy}
        title="Não foi possível carregar o ranking"
        description="Tente recarregar a página."
      />
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma venda registrada este mês"
        description="O ranking aparece assim que a primeira venda do mês for lançada."
      />
    );
  }

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {ranking.map((v) => (
        <div key={v.vendedor_id} className="flex items-center gap-4 px-5 py-4">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center text-sm font-semibold",
              CORES_POSICAO[v.posicao] ?? "text-muted-foreground"
            )}
          >
            {v.posicao <= 3 ? <Medal className="size-5" /> : v.posicao}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{v.vendedor_nome}</p>
            <p className="text-xs text-muted-foreground">{v.quantidade_vendas} vendas</p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-foreground">
            {formatoMoeda.format(v.total_vendido)}
          </p>
        </div>
      ))}
    </Card>
  );
}
