import { ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AtividadeVendedorRow } from "./atividade-vendedor-row";

/**
 * Atividades da equipe na data filtrada — visível para gerente/auxiliar.
 * Vendedores sem registro no dia aparecem com 0 (não somem da lista),
 * já que a lista parte de `perfis`, não de `atividades_diarias`.
 */
export async function AtividadesEquipe({ unidadeId, data }: { unidadeId: string; data: string }) {
  const supabase = await createClient();

  const { data: vendedores } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("unidade_id", unidadeId)
    .eq("papel", "vendedor")
    .order("nome");

  if (!vendedores || vendedores.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nenhum vendedor cadastrado"
        description="Cadastre vendedores em Equipe para acompanhar as atividades diárias."
      />
    );
  }

  const { data: atividades } = await supabase
    .from("atividades_diarias")
    .select("vendedor_id, ligacoes_realizadas, videos_produzidos, leads_recebidos")
    .eq("unidade_id", unidadeId)
    .eq("data", data);

  const atividadePorVendedor = new Map(atividades?.map((a) => [a.vendedor_id, a]));

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {vendedores.map((vendedor) => {
        const atividade = atividadePorVendedor.get(vendedor.id);
        return (
          <AtividadeVendedorRow
            key={vendedor.id}
            nome={vendedor.nome}
            ligacoes={atividade?.ligacoes_realizadas ?? 0}
            videos={atividade?.videos_produzidos ?? 0}
            leads={atividade?.leads_recebidos ?? 0}
          />
        );
      })}
    </Card>
  );
}
