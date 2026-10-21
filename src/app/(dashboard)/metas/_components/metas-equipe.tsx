import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { garantirMetasDaUnidade } from "../data";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function primeiroDiaDoMesAtual(): string {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

/**
 * Progresso de meta de todos os vendedores da unidade — visível para
 * gerente/auxiliar administrativa. `garantirMetasDaUnidade` provisiona
 * a linha do mês para quem ainda não tem, então ninguém "some" da
 * lista por nunca ter aberto a própria página de metas.
 */
export async function MetasEquipe({ unidadeId }: { unidadeId: string }) {
  const supabase = await createClient();
  await garantirMetasDaUnidade(supabase, unidadeId);

  const mesAtual = primeiroDiaDoMesAtual();
  const { data: progressos } = await supabase
    .from("metas_progresso")
    .select("*")
    .eq("unidade_id", unidadeId)
    .eq("mes_referencia", mesAtual);

  if (!progressos || progressos.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="Nenhum vendedor com meta este mês"
        description="Cadastre vendedores em Equipe para que apareçam aqui."
      />
    );
  }

  const vendedorIds = progressos.map((p) => p.vendedor_id);
  const { data: perfis } = await supabase
    .from("perfis")
    .select("id, nome")
    .in("id", vendedorIds);

  const nomeDoVendedor = new Map(perfis?.map((p) => [p.id, p.nome]));

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {progressos
        .sort((a, b) => b.total_vendido - a.total_vendido)
        .map((progresso) => {
          const alvo = progresso.meta_valor + progresso.deficit_anterior;
          const percentual = alvo > 0 ? progresso.total_vendido / alvo : 0;

          return (
            <div key={progresso.meta_id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {nomeDoVendedor.get(progresso.vendedor_id) ?? "Vendedor"}
                  </p>
                  <Badge tone={progresso.comissao_liberada ? "success" : "neutral"}>
                    {progresso.comissao_liberada ? "Liberada" : "Pendente"}
                  </Badge>
                </div>
                <ProgressBar
                  value={percentual}
                  tone={progresso.comissao_liberada ? "success" : "primary"}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatoMoeda.format(progresso.total_vendido)} de{" "}
                  {formatoMoeda.format(alvo)}
                </p>
              </div>
            </div>
          );
        })}
    </Card>
  );
}
