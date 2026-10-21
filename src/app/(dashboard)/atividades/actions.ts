"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AtividadeFormState } from "./form-state";

function numeroOuZero(formData: FormData, campo: string): number {
  const valor = Number(formData.get(campo));
  return Number.isFinite(valor) && valor >= 0 ? Math.floor(valor) : 0;
}

function valorMonetarioOuZero(formData: FormData, campo: string): number {
  const texto = (formData.get(campo) as string)?.replace(",", ".");
  const valor = Number(texto);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function dataValidaOuHoje(formData: FormData): string {
  const data = formData.get("data") as string;
  // Regex simples de YYYY-MM-DD — evita aceitar string arbitrária no
  // upsert; se vier algo fora do formato (ou vazio), cai em hoje.
  if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  return new Date().toISOString().slice(0, 10);
}

/**
 * Upsert por (vendedor_id, data) — Etapa 6. A data agora vem do
 * formulário (padrão: hoje), então o vendedor pode registrar/corrigir
 * atividades de um dia específico, não só "hoje sempre".
 */
export async function registrarAtividade(
  _prevState: AtividadeFormState,
  formData: FormData
): Promise<AtividadeFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("unidade_id, papel")
    .eq("id", user.id)
    .single();

  if (!perfilAtual || perfilAtual.papel !== "vendedor") {
    return { error: "Apenas vendedores registram atividades diárias.", success: false };
  }

  const data = dataValidaOuHoje(formData);
  const ligacoesRealizadas = numeroOuZero(formData, "ligacoes_realizadas");
  const ligacoesAtendidas = Math.min(
    numeroOuZero(formData, "ligacoes_atendidas"),
    ligacoesRealizadas
  );

  const { error } = await supabase.from("atividades_diarias").upsert(
    {
      vendedor_id: user.id,
      unidade_id: perfilAtual.unidade_id,
      data,
      ligacoes_realizadas: ligacoesRealizadas,
      ligacoes_atendidas: ligacoesAtendidas,
      videos_produzidos: numeroOuZero(formData, "videos_produzidos"),
      leads_recebidos: numeroOuZero(formData, "leads_recebidos"),
      quantidade_vendas: numeroOuZero(formData, "quantidade_vendas"),
      valor_vendas: valorMonetarioOuZero(formData, "valor_vendas"),
      seguros_fechados: numeroOuZero(formData, "seguros_fechados"),
    },
    { onConflict: "vendedor_id,data" }
  );

  if (error) {
    console.error("[atividades/registrarAtividade] erro do Supabase:", error);
    return { error: `Erro ao salvar: ${error.message}.`, success: false };
  }

  revalidatePath("/atividades");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");
  return { error: null, success: true };
}
