import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function primeiroDiaDoMes(offsetMeses = 0): string {
  const hoje = new Date();
  const data = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + offsetMeses, 1));
  return data.toISOString().slice(0, 10);
}

/**
 * Garante que existe uma linha em `metas_mensais` para o vendedor no
 * mês atual — sem ela, a view `metas_progresso` simplesmente não
 * mostra nada para esse vendedor (LEFT JOIN parte de `metas_mensais`,
 * não de `perfis`).
 *
 * Provisionamento sob demanda (na primeira visita à página no mês),
 * não um cron — razoável para o volume atual (3 vendedores). Aplica a
 * fórmula de déficit já confirmada em BUSINESS_RULES.md §1.2: o
 * "saldo_faltante" do mês anterior (se a comissão não foi liberada)
 * vira o `deficit_anterior` do mês novo.
 */
export async function garantirMetaDoMes(
  supabase: SupabaseClient<Database>,
  vendedorId: string,
  unidadeId: string
): Promise<void> {
  const mesAtual = primeiroDiaDoMes();

  const { data: existente } = await supabase
    .from("metas_mensais")
    .select("id")
    .eq("vendedor_id", vendedorId)
    .eq("mes_referencia", mesAtual)
    .maybeSingle();

  if (existente) return;

  const mesAnterior = primeiroDiaDoMes(-1);
  const { data: progressoAnterior } = await supabase
    .from("metas_progresso")
    .select("saldo_faltante, comissao_liberada")
    .eq("vendedor_id", vendedorId)
    .eq("mes_referencia", mesAnterior)
    .maybeSingle();

  const deficitHerdado =
    progressoAnterior && !progressoAnterior.comissao_liberada
      ? progressoAnterior.saldo_faltante
      : 0;

  await supabase.from("metas_mensais").insert({
    vendedor_id: vendedorId,
    unidade_id: unidadeId,
    mes_referencia: mesAtual,
    meta_valor: 200000,
    deficit_anterior: deficitHerdado,
  });
}

/**
 * Mesma garantia, mas para todos os vendedores de uma unidade — usada
 * quando gerente/auxiliar abre a página (eles precisam ver a equipe
 * toda, não só quem já visitou a própria página de metas este mês).
 */
export async function garantirMetasDaUnidade(
  supabase: SupabaseClient<Database>,
  unidadeId: string
): Promise<void> {
  const { data: vendedores } = await supabase
    .from("perfis")
    .select("id")
    .eq("unidade_id", unidadeId)
    .eq("papel", "vendedor");

  if (!vendedores) return;

  await Promise.all(
    vendedores.map((v) => garantirMetaDoMes(supabase, v.id, unidadeId))
  );
}
