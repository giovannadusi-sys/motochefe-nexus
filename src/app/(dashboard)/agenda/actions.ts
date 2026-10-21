"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoAcompanhamento } from "@/types/database";
import type { AcompanhamentoFormState } from "./form-state";

const TIPOS_VALIDOS: TipoAcompanhamento[] = [
  "follow_up",
  "retorno",
  "seguro",
  "revisao",
  "pos_venda",
  "outro",
];

export async function criarAcompanhamento(
  _prevState: AcompanhamentoFormState,
  formData: FormData
): Promise<AcompanhamentoFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfilAtual) {
    return { error: "Não foi possível identificar seu perfil.", success: false };
  }

  const clienteId = formData.get("cliente_id") as string;
  const tipo = formData.get("tipo") as TipoAcompanhamento;
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const data = formData.get("data") as string;

  if (!clienteId || !tipo || !data) {
    return { error: "Preencha cliente, tipo e data.", success: false };
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return { error: "Tipo inválido.", success: false };
  }

  const { error } = await supabase.from("acompanhamentos").insert({
    unidade_id: perfilAtual.unidade_id,
    cliente_id: clienteId,
    responsavel_id: user.id,
    tipo,
    descricao,
    data,
  });

  if (error) {
    console.error("[agenda/criarAcompanhamento] erro do Supabase:", error);
    return { error: "Erro ao salvar o acompanhamento. Tente novamente.", success: false };
  }

  revalidatePath("/agenda");
  return { error: null, success: true };
}

export async function concluirAcompanhamento(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("acompanhamentos").update({ status: "concluido" }).eq("id", id);
  revalidatePath("/agenda");
}

export async function atualizarAcompanhamento(
  _prevState: AcompanhamentoFormState,
  formData: FormData
): Promise<AcompanhamentoFormState> {
  const id = formData.get("id") as string;
  const clienteId = formData.get("cliente_id") as string;
  const tipo = formData.get("tipo") as TipoAcompanhamento;
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const data = formData.get("data") as string;

  if (!id || !clienteId || !tipo || !data) {
    return { error: "Preencha cliente, tipo e data.", success: false };
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return { error: "Tipo inválido.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("acompanhamentos")
    .update({ cliente_id: clienteId, tipo, descricao, data })
    .eq("id", id);

  if (error) {
    return { error: "Erro ao salvar as alterações. Tente novamente.", success: false };
  }

  revalidatePath("/agenda");
  return { error: null, success: true };
}

export async function excluirAcompanhamento(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("acompanhamentos").delete().eq("id", id);
  revalidatePath("/agenda");
}

export async function converterOportunidadeSeguro(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("oportunidades_seguro")
    .update({ status: "convertida", data_conversao: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidatePath("/agenda");
}
