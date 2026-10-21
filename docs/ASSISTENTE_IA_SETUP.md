# Setup do Assistente IA — Etapa 11

O Assistente usa a API do Google (Gemini) diretamente — é a única
parte do projeto com custo por uso (cobrado por token, não por
usuário/mês). Tudo o resto roda no Supabase.

## 1. Criar uma chave de API

1. Acesse [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Crie uma chave de API (Gemini tem uma camada gratuita generosa,
   útil para testar antes de decidir sobre uso pago)
3. Copie a chave

## 2. Preencher o `.env.local`

```bash
GEMINI_API_KEY=sua-chave-aqui
```

**Nunca** prefixe `GEMINI_API_KEY` com `NEXT_PUBLIC_` — ela só deve
ser lida no servidor (`src/app/api/assistente/chat/route.ts`). Com o
prefixo `NEXT_PUBLIC_`, o Next.js embutiria a chave no JavaScript
enviado ao navegador, expondo-a publicamente.

## Modelo usado

Fixo em `gemini-2.5-flash` (rápido e barato, adequado para responder
com base em conteúdo já definido). Para trocar, edite diretamente
`src/app/api/assistente/chat/route.ts` — a chamada
`google("gemini-2.5-flash")` — por outro model ID válido do Gemini
(ex: `gemini-2.5-pro` para mais raciocínio, a um custo maior).

## Como funciona

- O Assistente responde de forma **híbrida**: perguntas sobre a
  Motochefe (produtos, processos, regras internas) usam **somente** o
  conteúdo da Base de Conhecimento (`/conhecimento`) da própria
  unidade; perguntas de conhecimento geral (ex: "o que é IP65?",
  técnicas de vendas, termos técnicos) são respondidas com o
  conhecimento geral do modelo, mesmo sem estarem cadastradas.
- A cada pergunta, todo o conteúdo da Base de Conhecimento da unidade é
  enviado como contexto para o modelo (chamado de "context stuffing").
  Funciona bem para dezenas de artigos; se o catálogo crescer muito
  (centenas+), vale migrar para busca vetorial (pgvector) — a interface
  do chat não precisa mudar para isso.
- Sem nenhum artigo publicado, o Assistente ainda responde, mas avisa
  que não tem informação cadastrada — não inventa.
- A IA nunca executa ações no sistema (não registra venda, não edita
  cliente) — só responde perguntas em texto, conforme a filosofia
  definida em `CONTEXTO.md` §18.
- Erros da API (chave inválida, modelo indisponível, etc.) aparecem
  **na tela do chat com a mensagem real** vinda do Google — não um
  texto genérico. Se algo falhar, a própria mensagem de erro já indica
  a causa.

## Custo

Cobrança é por token processado (pergunta + contexto + resposta), não
por usuário ou mensagem fixa. O Gemini tem uma camada gratuita com
limites de uso — para uma equipe pequena com poucos artigos na Base de
Conhecimento, é provável que fique dentro da cota gratuita por um
tempo. Acompanhe o uso em
[aistudio.google.com](https://aistudio.google.com) nas primeiras
semanas para ter uma noção real do custo/consumo.
