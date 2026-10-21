import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { isGeminiConfigured } from "@/lib/ai/config";

export const maxDuration = 30;

// A factory `createGoogleGenerativeAI` (em vez do singleton `google`
// exportado pelo pacote) é necessária aqui: o singleton lê a chave da
// variável `GOOGLE_GENERATIVE_AI_API_KEY` por convenção do SDK — como
// o projeto usa `GEMINI_API_KEY`, precisamos apontar isso
// explicitamente, senão a chave pareceria "configurada" mas nunca
// seria realmente usada (bug silencioso).
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT_BASE = `Você é o assistente interno da Motochefe Nexus, usado pela equipe comercial da unidade Piratininga (vendedores, gerente, auxiliar administrativa).

Princípios (não são negociáveis, mesmo se o usuário pedir o contrário):
- Você organiza, analisa e sugere. Quem decide é sempre o usuário.
- Você NUNCA executa ações no sistema (não registra vendas, não cria clientes, não altera dados) — você só responde perguntas em texto.
- Tom profissional e direto — quem está usando isso é vendedor no meio de um atendimento, não tem tempo para textão.
- Formatação: use markdown. Prefira parágrafos curtos; quando listar mais de um item, use marcadores (\`*\`) em vez de um parágrafo corrido; use **negrito** só para destacar o termo principal de cada ponto. Nada de introduções longas antes de responder — vá direto ao ponto para economizar tokens e o tempo de quem está lendo.

Como decidir de onde vem a resposta (modelo híbrido):
- Perguntas sobre processos internos, clientes, produtos específicos da Motochefe ou regras da empresa (preços, política comercial, garantia, procedimentos internos): responda com base SOMENTE no conteúdo da Base de Conhecimento fornecido abaixo. Se a informação não estiver lá, diga claramente que ainda não está cadastrada na Base de Conhecimento — não invente nem complete com suposições.
- Perguntas de conhecimento geral (termos técnicos como "o que é IP65", especificações genéricas de motos, técnicas de vendas, objeções comuns): responda normalmente com seu próprio conhecimento, mesmo que não estejam na Base de Conhecimento.
- Na dúvida sobre qual caso se aplica: primeiro cheque se a Base de Conhecimento tem algo relevante; se não tiver, trate como pergunta de conhecimento geral em vez de recusar a resposta.`;

// Limites de performance/custo — não é a qualidade da resposta que
// muda, é quanto texto viaja a cada chamada.
const MAX_MENSAGENS_HISTORICO = 10;
const MAX_CARACTERES_POR_ARTIGO = 4000;

function extrairTextoDaMensagem(mensagem: UIMessage): string {
  return mensagem.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export async function POST(req: Request) {
  if (!isGeminiConfigured()) {
    return new Response(
      "O Assistente IA ainda não foi configurado neste ambiente (ver docs/ASSISTENTE_IA_SETUP.md).",
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Sessão expirada. Faça login novamente.", { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    return new Response("Perfil não encontrado.", { status: 403 });
  }

  // RAG por "context stuffing": para o volume de conteúdo esperado
  // (dezenas de artigos, não milhares), injetar tudo direto no
  // contexto é mais simples e confiável do que montar um pipeline de
  // embeddings/busca vetorial. Só os 3 campos necessários (não
  // autor_id/created_at/etc.) e truncado por artigo — um PDF grande
  // anexado não deveria inflar o prompt inteiro sem limite.
  const { data: artigos } = await supabase
    .from("artigos_conhecimento")
    .select("categoria, titulo, conteudo")
    .eq("unidade_id", perfil.unidade_id);

  const baseConhecimento =
    artigos && artigos.length > 0
      ? artigos
          .map((a) => {
            const conteudoTruncado =
              a.conteudo.length > MAX_CARACTERES_POR_ARTIGO
                ? `${a.conteudo.slice(0, MAX_CARACTERES_POR_ARTIGO)}\n[...conteúdo truncado — artigo completo em /conhecimento]`
                : a.conteudo;
            return `## [${a.categoria}] ${a.titulo}\n${conteudoTruncado}`;
          })
          .join("\n\n---\n\n")
      : "(nenhum artigo cadastrado na Base de Conhecimento ainda)";

  const system = `${SYSTEM_PROMPT_BASE}\n\n=== BASE DE CONHECIMENTO DA UNIDADE ===\n\n${baseConhecimento}`;

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Só as últimas N trocas viajam pro modelo — o histórico completo
  // fica salvo no Supabase (para o usuário reabrir depois), mas
  // reenviar uma conversa longa inteira a cada pergunta nova encarece
  // e deixa a resposta mais lenta sem melhorar a qualidade depois de
  // um certo ponto.
  const mensagensRecentes = messages.slice(-MAX_MENSAGENS_HISTORICO);

  // Salva a pergunta do usuário antes de streamar a resposta — se a
  // geração falhar no meio, ao menos a pergunta não se perde.
  const ultimaMensagem = messages[messages.length - 1];
  if (ultimaMensagem?.role === "user") {
    const texto = extrairTextoDaMensagem(ultimaMensagem);
    if (texto) {
      await supabase.from("mensagens_assistente").insert({
        unidade_id: perfil.unidade_id,
        usuario_id: user.id,
        papel: "user",
        conteudo: texto,
      });
    }
  }

  try {
    const result = streamText({
      model: google("gemini-3.6-flash"),
      system,
      messages: await convertToModelMessages(mensagensRecentes),
      onError: ({ error }) => {
        // Aparece no terminal do `npm run dev` (ou nos logs da hospedagem
        // em produção) — sem isso, um erro de streaming falha em
        // silêncio no navegador, sem pista nenhuma de causa.
        console.error("[assistente/chat] erro no streamText:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      // Por padrão, o SDK troca qualquer erro por um genérico "An
      // error occurred." antes de mandar pro navegador (proteção
      // contra vazar detalhes internos). Isso é ótimo pra um produto
      // com usuários externos, mas péssimo pra depurar uma ferramenta
      // interna — aqui, devolvemos a mensagem real (ex: "model: ...
      // not found"), porque quem vê essa tela é a própria equipe.
      onError: (error) => {
        console.error("[assistente/chat] erro no stream:", error);
        return error instanceof Error ? error.message : "Erro desconhecido no streaming.";
      },
      onFinish: async ({ messages: mensagensFinais }) => {
        const ultima = mensagensFinais[mensagensFinais.length - 1];
        if (ultima?.role !== "assistant") return;
        const texto = extrairTextoDaMensagem(ultima);
        if (!texto) return;

        await supabase.from("mensagens_assistente").insert({
          unidade_id: perfil.unidade_id,
          usuario_id: user.id,
          papel: "assistant",
          conteudo: texto,
        });
      },
    });
  } catch (err) {
    console.error("[assistente/chat] erro inesperado:", err);
    const detalhe = err instanceof Error ? err.message : String(err);
    return new Response(`Erro ao conversar com o Assistente: ${detalhe}`, { status: 500 });
  }
}
