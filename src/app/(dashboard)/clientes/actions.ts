"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ClienteFormState } from "./form-state";

function valorOuNulo(formData: FormData, campo: string): string | null {
  const valor = (formData.get(campo) as string)?.trim();
  return valor ? valor : null;
}

export async function criarCliente(
  _prevState: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  const nome = (formData.get("nome") as string)?.trim();

  if (!nome) {
    return { error: "Nome é obrigatório.", success: false };
  }

  const supabase = await createClient();

  // unidade_atual() é a mesma função SQL usada nas policies de RLS —
  // reaproveitada aqui para saber em qual unidade inserir o cliente.
  const { data: unidadeId, error: unidadeError } = await supabase.rpc("unidade_atual");

  if (unidadeError || !unidadeId) {
    console.error("[clientes/criarCliente] erro ao obter unidade_atual():", unidadeError);
    return {
      error: "Não foi possível identificar sua unidade. Faça login novamente.",
      success: false,
    };
  }

  const { error } = await supabase.from("clientes").insert({
    unidade_id: unidadeId,
    nome,
    cpf: valorOuNulo(formData, "cpf"),
    telefone: valorOuNulo(formData, "telefone"),
    email: valorOuNulo(formData, "email"),
    data_nascimento: valorOuNulo(formData, "data_nascimento"),
    endereco: valorOuNulo(formData, "endereco"),
    cep: valorOuNulo(formData, "cep"),
    bairro: valorOuNulo(formData, "bairro"),
  });

  if (error) {
    console.error("[clientes/criarCliente] erro do Supabase:", error);
    // 23505 = unique_violation — CPF já cadastrado nesta unidade
    // (constraint definida em supabase/migrations/..._schema_inicial.sql)
    if (error.code === "23505") {
      return { error: "Já existe um cliente com esse CPF nesta unidade.", success: false };
    }
    return { error: "Erro ao salvar o cliente. Tente novamente.", success: false };
  }

  revalidatePath("/clientes");
  return { error: null, success: true };
}

