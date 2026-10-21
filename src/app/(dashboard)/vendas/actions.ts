"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormaPagamento } from "@/types/database";
import { ACESSORIOS_DISPONIVEIS } from "@/config/acessorios";
import type { VendaFormState } from "./form-state";

const CAMPOS_VENDA =
  "id, cliente_id, data_venda, modelo_moto, cor, valor, forma_pagamento, detalhe_pagamento, seguro_contratado, chassi, origem_cliente, teve_brinde, teve_frete, observacoes, acessorios, valor_acessorios";

/** Lê os acessórios marcados; preço vem do catálogo (nunca do cliente). */
function lerAcessorios(formData: FormData) {
  const ids = formData.getAll("acessorios").map(String);
  const itens = ACESSORIOS_DISPONIVEIS.filter((a) => ids.includes(a.id)).map((a) => ({
    nome: a.nome,
    valor: a.valor,
  }));
  return { itens, total: itens.reduce((soma, a) => soma + a.valor, 0) };
}

const FORMAS_PAGAMENTO_VALIDAS: FormaPagamento[] = ["avista", "parcelado", "outro"];

function dataVendaValidaOuHoje(formData: FormData): string {
  const data = formData.get("data_venda") as string;
  if (data && /^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  return new Date().toISOString().slice(0, 10);
}

function lerCamposComuns(formData: FormData) {
  const clienteId = formData.get("cliente_id") as string;
  const dataVenda = dataVendaValidaOuHoje(formData);
  const modeloMoto = (formData.get("modelo_moto") as string)?.trim();
  const cor = (formData.get("cor") as string)?.trim() || null;
  const valorTexto = formData.get("valor") as string;
  const formaPagamento = formData.get("forma_pagamento") as FormaPagamento;
  const detalhePagamento = (formData.get("detalhe_pagamento") as string)?.trim() || null;
  const seguroContratado = formData.get("seguro_contratado") === "on";
  const chassi = (formData.get("chassi") as string)?.trim() || null;
  const origemCliente = (formData.get("origem_cliente") as string)?.trim() || null;
  const teveBrinde = formData.get("teve_brinde") === "on";
  const teveFrete = formData.get("teve_frete") === "on";
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;
  const acessorios = lerAcessorios(formData);

  const valor = Number(valorTexto?.replace(",", "."));

  return {
    clienteId,
    dataVenda,
    modeloMoto,
    cor,
    valor,
    formaPagamento,
    // "outro" não tem sub-opção — zera qualquer valor herdado do form.
    detalhePagamento: formaPagamento === "outro" ? null : detalhePagamento,
    seguroContratado,
    chassi,
    origemCliente,
    teveBrinde,
    teveFrete,
    observacoes,
    acessorios: acessorios.itens,
    valorAcessorios: acessorios.total,
  };
}

function validarCamposComuns(campos: ReturnType<typeof lerCamposComuns>): string | null {
  if (!campos.clienteId || !campos.modeloMoto) {
    return "Preencha cliente e modelo.";
  }
  if (!Number.isFinite(campos.valor) || campos.valor <= 0) {
    return "Valor precisa ser um número maior que zero.";
  }
  if (!FORMAS_PAGAMENTO_VALIDAS.includes(campos.formaPagamento)) {
    return "Forma de pagamento inválida.";
  }
  return null;
}

/** 3 meses corridos após a venda (BUSINESS_RULES.md §3.1). */
function dataRevisaoPadrao(dataVenda: string): string {
  const [ano, mes, dia] = dataVenda.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1 + 3, dia));
  return data.toISOString().slice(0, 10);
}

export async function criarVenda(
  _prevState: VendaFormState,
  formData: FormData
): Promise<VendaFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("papel, unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfilAtual || perfilAtual.papel !== "vendedor") {
    return { error: "Apenas vendedores podem registrar vendas.", success: false };
  }

  const campos = lerCamposComuns(formData);
  const erroValidacao = validarCamposComuns(campos);
  if (erroValidacao) {
    return { error: erroValidacao, success: false };
  }

  const { data: venda, error: erroVenda } = await supabase
    .from("vendas")
    .insert({
      unidade_id: perfilAtual.unidade_id,
      cliente_id: campos.clienteId,
      vendedor_id: user.id,
      data_venda: campos.dataVenda,
      modelo_moto: campos.modeloMoto,
      cor: campos.cor,
      valor: campos.valor,
      forma_pagamento: campos.formaPagamento,
      detalhe_pagamento: campos.detalhePagamento,
      seguro_contratado: campos.seguroContratado,
      chassi: campos.chassi,
      origem_cliente: campos.origemCliente,
      teve_brinde: campos.teveBrinde,
      teve_frete: campos.teveFrete,
      observacoes: campos.observacoes,
      acessorios: campos.acessorios,
      valor_acessorios: campos.valorAcessorios,
    })
    .select(CAMPOS_VENDA)
    .single();

  if (erroVenda || !venda) {
    console.error("[vendas/criarVenda] erro do Supabase:", erroVenda);
    if (erroVenda?.code === "23505") {
      return { error: "Já existe uma venda com esse chassi nesta unidade.", success: false };
    }
    return {
      error: `Erro ao registrar a venda: ${erroVenda?.message ?? "causa desconhecida"}.`,
      success: false,
    };
  }

  // Regra confirmada (BUSINESS_RULES.md §2.2): sem seguro na hora da
  // venda vira oportunidade, com janela de 120 dias.
  if (!campos.seguroContratado) {
    const { error: erroOportunidade } = await supabase.from("oportunidades_seguro").insert({
      unidade_id: perfilAtual.unidade_id,
      cliente_id: venda.cliente_id,
      venda_id: venda.id,
      vendedor_id: user.id,
    });
    if (erroOportunidade) {
      console.error("[vendas/criarVenda] falha ao criar oportunidade de seguro:", erroOportunidade);
    }
  }

  // Automação de revisão: 3 meses após a venda, aparece no sino de
  // notificações quando a data se aproxima (ver components/layout/notificacoes-bell.tsx).
  const { error: erroRevisao } = await supabase.from("revisoes").insert({
    unidade_id: perfilAtual.unidade_id,
    venda_id: venda.id,
    cliente_id: venda.cliente_id,
    data_prevista: dataRevisaoPadrao(campos.dataVenda),
  });
  if (erroRevisao) {
    console.error("[vendas/criarVenda] falha ao criar revisão automática:", erroRevisao);
  }

  revalidatePath("/vendas");
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  return { error: null, success: true, venda };
}

export async function atualizarVenda(
  _prevState: VendaFormState,
  formData: FormData
): Promise<VendaFormState> {
  const id = formData.get("id") as string;
  if (!id) {
    return { error: "Venda inválida.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", success: false };
  }

  const campos = lerCamposComuns(formData);
  const erroValidacao = validarCamposComuns(campos);
  if (erroValidacao) {
    return { error: erroValidacao, success: false };
  }

  const { data: venda, error } = await supabase
    .from("vendas")
    .update({
      cliente_id: campos.clienteId,
      data_venda: campos.dataVenda,
      modelo_moto: campos.modeloMoto,
      cor: campos.cor,
      valor: campos.valor,
      forma_pagamento: campos.formaPagamento,
      detalhe_pagamento: campos.detalhePagamento,
      seguro_contratado: campos.seguroContratado,
      chassi: campos.chassi,
      origem_cliente: campos.origemCliente,
      teve_brinde: campos.teveBrinde,
      teve_frete: campos.teveFrete,
      observacoes: campos.observacoes,
      acessorios: campos.acessorios,
      valor_acessorios: campos.valorAcessorios,
    })
    .eq("id", id)
    .select(CAMPOS_VENDA)
    .single();

  if (error || !venda) {
    console.error("[vendas/atualizarVenda] erro do Supabase:", error);
    if (error?.code === "23505") {
      return { error: "Já existe uma venda com esse chassi nesta unidade.", success: false };
    }
    return {
      error: `Erro ao salvar as alterações: ${error?.message ?? "sem permissão ou venda não encontrada"}.`,
      success: false,
    };
  }

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  return { error: null, success: true, venda };
}

export async function excluirVenda(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vendas").delete().eq("id", id).select("id");
  if (error) {
    console.error("[vendas/excluirVenda] erro do Supabase:", error);
    return { error: `Não foi possível excluir: ${error.message}.` };
  }
  if (!data || data.length === 0) {
    return { error: "Não foi possível excluir (venda inexistente ou sem permissão)." };
  }
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  return { error: null };
}
