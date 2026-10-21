"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PapelUsuario } from "@/types/database";
import type { CriarUsuarioState, AtualizarUsuarioState } from "./form-state";

const PAPEIS_QUE_PODEM_CRIAR: PapelUsuario[] = ["gerente", "auxiliar_administrativa"];
const PAPEIS_VALIDOS: PapelUsuario[] = ["vendedor", "gerente", "auxiliar_administrativa"];

export async function criarUsuario(
  _prevState: CriarUsuarioState,
  formData: FormData
): Promise<CriarUsuarioState> {
  // 1. Quem está pedindo isso, de verdade? Usa o client normal (RLS),
  //    nunca confia em nada vindo do formData para autorização.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente.", sucesso: null };
  }

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("papel, unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfilAtual || !PAPEIS_QUE_PODEM_CRIAR.includes(perfilAtual.papel)) {
    return {
      error: "Você não tem permissão para criar usuários.",
      sucesso: null,
    };
  }

  // 2. Validação dos dados do formulário
  const nome = (formData.get("nome") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const senha = formData.get("senha") as string;
  const papel = formData.get("papel") as PapelUsuario;

  if (!nome || !email || !senha) {
    return { error: "Preencha nome, e-mail e senha temporária.", sucesso: null };
  }
  if (senha.length < 8) {
    return { error: "A senha temporária precisa ter pelo menos 8 caracteres.", sucesso: null };
  }
  if (!PAPEIS_VALIDOS.includes(papel)) {
    return { error: "Papel inválido.", sucesso: null };
  }

  // 3. Criação de verdade — só a partir daqui usa o client admin
  //    (service_role), depois de já ter confirmado a autorização acima.
  const admin = createAdminClient();

  const { data: novoUsuario, error: erroCriacao } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // não depende de e-mail de confirmação (sem SMTP configurado)
  });

  if (erroCriacao || !novoUsuario.user) {
    if (erroCriacao?.code === "email_exists") {
      return { error: "Já existe um usuário com esse e-mail.", sucesso: null };
    }
    return { error: "Erro ao criar o usuário. Tente novamente.", sucesso: null };
  }

  const { error: erroPerfil } = await admin.from("perfis").insert({
    id: novoUsuario.user.id,
    unidade_id: perfilAtual.unidade_id,
    papel,
    nome,
  });

  if (erroPerfil) {
    // Perfil falhou depois do auth.users já criado — remove para não
    // deixar um usuário "fantasma" sem perfil associado.
    await admin.auth.admin.deleteUser(novoUsuario.user.id);
    return { error: "Erro ao salvar o perfil do usuário. Tente novamente.", sucesso: null };
  }

  revalidatePath("/equipe");
  return { error: null, sucesso: { email, senha, nome } };
}

async function checarPermissaoDeGestao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada. Faça login novamente." as const, user: null, supabase };

  const { data: perfilAtual } = await supabase
    .from("perfis")
    .select("papel, unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfilAtual || !PAPEIS_QUE_PODEM_CRIAR.includes(perfilAtual.papel)) {
    return {
      erro: "Você não tem permissão para gerenciar a equipe." as const,
      user,
      supabase,
      perfilAtual: null,
    };
  }

  return { erro: null, user, supabase, perfilAtual };
}

export async function atualizarUsuario(
  _prevState: AtualizarUsuarioState,
  formData: FormData
): Promise<AtualizarUsuarioState> {
  const permissao = await checarPermissaoDeGestao();
  if (permissao.erro) {
    return { error: permissao.erro, success: false };
  }

  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const papel = formData.get("papel") as PapelUsuario;

  if (!id || !nome || !PAPEIS_VALIDOS.includes(papel)) {
    return { error: "Preencha nome e papel corretamente.", success: false };
  }

  const { error } = await permissao.supabase
    .from("perfis")
    .update({ nome, papel })
    .eq("id", id);

  if (error) {
    console.error("[equipe/atualizarUsuario] erro do Supabase:", error);
    return { error: "Erro ao salvar as alterações. Tente novamente.", success: false };
  }

  revalidatePath("/equipe");
  return { error: null, success: true };
}

export async function excluirUsuario(id: string): Promise<{ error: string | null }> {
  const permissao = await checarPermissaoDeGestao();
  if (permissao.erro) {
    return { error: permissao.erro };
  }

  if (permissao.user!.id === id) {
    return { error: "Você não pode excluir a própria conta." };
  }

  // Exclusão de verdade exige a Admin API (mesma razão da criação): o
  // registro em auth.users só pode ser removido com service_role. O
  // ON DELETE CASCADE do perfis cuida de remover o perfil junto.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    console.error("[equipe/excluirUsuario] erro do Supabase:", error);
    return { error: "Erro ao excluir o usuário. Tente novamente." };
  }

  revalidatePath("/equipe");
  return { error: null };
}
