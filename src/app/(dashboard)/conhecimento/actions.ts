"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaConhecimento } from "@/types/database";
import type { ArtigoFormState } from "./form-state";

const CATEGORIAS_VALIDAS: CategoriaConhecimento[] = [
  "produtos",
  "especificacoes",
  "processos",
  "garantia",
  "treinamentos",
];

async function checarPermissaoDeEdicao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { erro: "Sessão expirada. Faça login novamente." as const, supabase, user: null };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfil || !["gerente", "auxiliar_administrativa"].includes(perfil.papel)) {
    return {
      erro: "Você não tem permissão para editar a Base de Conhecimento." as const,
      supabase,
      user,
    };
  }

  return { erro: null, supabase, user, perfil };
}

/**
 * Extrai o texto de um PDF e limpa espaços/quebras de linha excessivos.
 * Falha graciosamente (retorna null) — um PDF de imagem escaneada sem
 * texto, por exemplo, não deve impedir o artigo de ser salvo.
 */
async function extrairTextoDoPdf(arquivo: File): Promise<string | null> {
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const resultado = await parser.getText();
    await parser.destroy();

    const texto = resultado.text
      .replace(/\r\n/g, "\n")
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, "") // separador de página da lib, não é conteúdo real
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return texto.length > 0 ? texto : null;
  } catch (err) {
    console.error("[conhecimento] erro ao extrair texto do PDF:", err);
    return null;
  }
}

/**
 * Faz upload do PDF (se algum tiver sido selecionado) para o bucket
 * `base-conhecimento` e devolve a URL pública + o texto extraído. Sem
 * arquivo selecionado (tamanho 0), devolve tudo null sem erro — o
 * campo é opcional.
 */
async function subirArquivoSeHouver(
  supabase: Awaited<ReturnType<typeof createClient>>,
  unidadeId: string,
  formData: FormData
): Promise<{ url: string | null; textoExtraido: string | null; erro: string | null }> {
  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo || arquivo.size === 0) {
    return { url: null, textoExtraido: null, erro: null };
  }

  if (arquivo.type !== "application/pdf") {
    return { url: null, textoExtraido: null, erro: "Só é possível enviar arquivos PDF." };
  }

  const caminho = `${unidadeId}/${crypto.randomUUID()}-${arquivo.name}`;
  const { error } = await supabase.storage.from("base-conhecimento").upload(caminho, arquivo, {
    contentType: "application/pdf",
  });

  if (error) {
    console.error("[conhecimento] erro ao subir PDF:", error);
    return { url: null, textoExtraido: null, erro: "Erro ao enviar o arquivo PDF. Tente novamente." };
  }

  const { data } = supabase.storage.from("base-conhecimento").getPublicUrl(caminho);
  const textoExtraido = await extrairTextoDoPdf(arquivo);

  return { url: data.publicUrl, textoExtraido, erro: null };
}

export async function criarArtigo(
  _prevState: ArtigoFormState,
  formData: FormData
): Promise<ArtigoFormState> {
  const permissao = await checarPermissaoDeEdicao();
  if (permissao.erro || !permissao.perfil || !permissao.user) {
    return { error: permissao.erro ?? "Erro desconhecido.", success: false };
  }

  const categoria = formData.get("categoria") as CategoriaConhecimento;
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string)?.trim();
  const linkExterno = (formData.get("link_externo") as string)?.trim() || null;

  if (!titulo || !conteudo || !CATEGORIAS_VALIDAS.includes(categoria)) {
    return { error: "Preencha categoria, título e conteúdo.", success: false };
  }

  const { url: arquivoUrl, textoExtraido, erro: erroUpload } = await subirArquivoSeHouver(
    permissao.supabase,
    permissao.perfil.unidade_id,
    formData
  );
  if (erroUpload) {
    return { error: erroUpload, success: false };
  }

  const conteudoFinal = textoExtraido
    ? `${conteudo}\n\n---\n\n**Conteúdo extraído do PDF anexado:**\n\n${textoExtraido}`
    : conteudo;

  const { error } = await permissao.supabase.from("artigos_conhecimento").insert({
    unidade_id: permissao.perfil.unidade_id,
    categoria,
    titulo,
    conteudo: conteudoFinal,
    arquivo_url: arquivoUrl,
    link_externo: linkExterno,
    autor_id: permissao.user.id,
  });

  if (error) {
    console.error("[conhecimento/criarArtigo] erro do Supabase:", error);
    return { error: `Erro ao salvar o artigo: ${error.message}.`, success: false };
  }

  revalidatePath("/conhecimento");
  return { error: null, success: true };
}

export async function atualizarArtigo(
  _prevState: ArtigoFormState,
  formData: FormData
): Promise<ArtigoFormState> {
  const permissao = await checarPermissaoDeEdicao();
  if (permissao.erro || !permissao.perfil) {
    return { error: permissao.erro ?? "Erro desconhecido.", success: false };
  }

  const id = formData.get("id") as string;
  const categoria = formData.get("categoria") as CategoriaConhecimento;
  const titulo = (formData.get("titulo") as string)?.trim();
  const conteudo = (formData.get("conteudo") as string)?.trim();
  const linkExterno = (formData.get("link_externo") as string)?.trim() || null;

  if (!id || !titulo || !conteudo || !CATEGORIAS_VALIDAS.includes(categoria)) {
    return { error: "Preencha categoria, título e conteúdo.", success: false };
  }

  const { url: novoArquivoUrl, textoExtraido, erro: erroUpload } = await subirArquivoSeHouver(
    permissao.supabase,
    permissao.perfil.unidade_id,
    formData
  );
  if (erroUpload) {
    return { error: erroUpload, success: false };
  }

  const conteudoFinal = textoExtraido
    ? `${conteudo}\n\n---\n\n**Conteúdo extraído do PDF anexado:**\n\n${textoExtraido}`
    : conteudo;

  const atualizacao: {
    categoria: CategoriaConhecimento;
    titulo: string;
    conteudo: string;
    link_externo: string | null;
    arquivo_url?: string;
  } = { categoria, titulo, conteudo: conteudoFinal, link_externo: linkExterno };
  // Só substitui o PDF se um novo arquivo foi enviado — não apaga o
  // existente sem querer quando o campo de arquivo fica vazio na edição.
  if (novoArquivoUrl) {
    atualizacao.arquivo_url = novoArquivoUrl;
  }

  const { error } = await permissao.supabase
    .from("artigos_conhecimento")
    .update(atualizacao)
    .eq("id", id);

  if (error) {
    console.error("[conhecimento/atualizarArtigo] erro do Supabase:", error);
    return { error: `Erro ao salvar as alterações: ${error.message}.`, success: false };
  }

  revalidatePath("/conhecimento");
  revalidatePath(`/conhecimento/${id}`);
  return { error: null, success: true };
}

export async function excluirArtigo(id: string): Promise<void> {
  const permissao = await checarPermissaoDeEdicao();
  if (permissao.erro) return;

  await permissao.supabase.from("artigos_conhecimento").delete().eq("id", id);
  revalidatePath("/conhecimento");
  redirect("/conhecimento");
}
