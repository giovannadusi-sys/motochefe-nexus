import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { garantirMetaDoMes } from "../data";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

/**
 * Meta do próprio vendedor no mês atual. `garantirMetaDoMes` roda antes
 * da leitura — na primeira visita do mês, cria a linha com o déficit
 * já herdado do mês anterior (BUSINESS_RULES.md §1.2).
 */
export async function MetaVendedor({
  vendedorId,
  unidadeId,
}: {
  vendedorId: string;
  unidadeId: string;
}) {
  const supabase = await createClient();
  await garantirMetaDoMes(supabase, vendedorId, unidadeId);

  const { data: progresso } = await supabase
    .from("metas_progresso")
    .select("*")
    .eq("vendedor_id", vendedorId)
    .order("mes_referencia", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!progresso) {
    return (
      <EmptyState
        icon={Target}
        title="Meta ainda não disponível"
        description="Recarregue a página em instantes."
      />
    );
  }

  const alvo = progresso.meta_valor + progresso.deficit_anterior;
  const percentual = alvo > 0 ? progresso.total_vendido / alvo : 0;
  const mesLabel = formatoMes.format(new Date(`${progresso.mes_referencia}T12:00:00`));

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="capitalize">{mesLabel}</CardTitle>
        <Badge tone={progresso.comissao_liberada ? "success" : "neutral"}>
          {progresso.comissao_liberada ? "Comissão liberada" : "Comissão pendente"}
        </Badge>
      </CardHeader>

      <p className="text-2xl font-semibold text-foreground">
        {formatoMoeda.format(progresso.total_vendido)}
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Meta: {formatoMoeda.format(progresso.meta_valor)}
        {progresso.deficit_anterior > 0 && (
          <> + {formatoMoeda.format(progresso.deficit_anterior)} de déficit acumulado</>
        )}
      </p>

      <ProgressBar
        value={percentual}
        tone={progresso.comissao_liberada ? "success" : "primary"}
        aria-label={`${Math.round(percentual * 100)}% da meta`}
      />

      {!progresso.comissao_liberada && (
        <p className="mt-3 text-xs text-muted-foreground">
          Faltam {formatoMoeda.format(progresso.saldo_faltante)} para liberar a comissão deste mês.
        </p>
      )}
    </Card>
  );
}
