# MEMÓRIA DO PROJETO — Motochefe Nexus

> Arquivo vivo. Atualizar ao final de cada etapa com o que foi decidido,
> por quê, e o que fica pendente. Serve para retomar o contexto em
> qualquer sessão futura (com Claude ou qualquer outra ferramenta).

---

## Etapa 12 — Migração do Assistente IA: Anthropic → Google Gemini ✅ (concluída)

**Data:** 2026-08-27

A pedido da Gi, trocado o provedor de IA do Assistente. Motivo não
documentado por ela — presumo teste de custo/qualidade entre
provedores, já que a arquitetura (RAG por context stuffing, guardrails
de "organiza/analisa/sugere") não depende do provedor específico.

**O que mudou:**
- `@ai-sdk/anthropic` removido, `@ai-sdk/google` instalado
- `src/lib/ai/config.ts`: `isAnthropicConfigured()` →
  `isGeminiConfigured()`, checando `GEMINI_API_KEY`
- `src/app/api/assistente/chat/route.ts`: modelo fixo em
  `gemini-2.5-flash` (antes configurável via `ANTHROPIC_MODEL`, com
  fallback `claude-haiku-4-5-20251001`)
- Componente de aviso "não configurado" renomeado e atualizado
  (`anthropic-nao-configurado.tsx` → `ia-nao-configurada.tsx`)
- `docs/ASSISTENTE_IA_SETUP.md` reescrito para o fluxo do Google AI
  Studio em vez do console da Anthropic

**Decisão técnica que vale registrar:** usei `createGoogleGenerativeAI`
(factory) em vez do singleton `google` exportado pelo pacote. O
singleton lê a chave da variável `GOOGLE_GENERATIVE_AI_API_KEY` por
convenção do SDK — mas o projeto usa `GEMINI_API_KEY` (nome que a Gi já
tinha escolhido). Usar o singleton teria criado um bug silencioso: a
chave pareceria configurada (`isGeminiConfigured()` retornando `true`),
mas a chamada de verdade falharia por não achar a variável esperada
pelo SDK. A factory permite apontar explicitamente qual variável usar.

**Pendência:** o modelo ficou fixo no código (sem variável de ambiente
equivalente ao antigo `ANTHROPIC_MODEL`) — trocar exige editar
`route.ts` diretamente. Se isso incomodar no dia a dia, é simples
reintroduzir uma variável `GEMINI_MODEL` com fallback.

### Ajuste 2026-08-27 — prompt híbrido

O prompt original só permitia responder com base na Base de
Conhecimento, recusando qualquer pergunta fora dela (ex: "o que é
IP65?"). A pedido da Gi, mudou para um modelo híbrido: perguntas sobre
a Motochefe (produtos, processos, regras internas) continuam restritas
à Base de Conhecimento; perguntas de conhecimento geral (termos
técnicos, técnicas de venda) são respondidas livremente pelo modelo. A
instrução de "não inventar" continua valendo só para o primeiro caso.

---

## Etapa 11 — Base de Conhecimento + Assistente IA ✅ (concluída)

**Data:** 2026-08-25

Última dupla de módulos do MVP original (`CONTEXTO.md` §21). Diferente
das etapas anteriores, envolveu uma conversa de escopo antes de
codificar — essas duas áreas tinham decisões de arquitetura reais em
aberto, não só regras de negócio.

**Decisões confirmadas com Gi antes de implementar:**
- Base de Conhecimento: **Nexus hospeda o conteúdo estável diretamente**
  (wiki interna), não só um índice apontando pra plataforma de
  treinamento existente
- Permissão: **todos leem, só gerente/auxiliar administrativa
  criam/editam/excluem**
- Assistente IA: **integração real agora**, aceitando o custo de API
  por uso (diferente do resto do projeto, que roda inteiro no Supabase)

**Decisões técnicas que eu tomei e só avisei** (não são regra de
negócio, são "como construir", onde havia uma resposta clara de
"começar simples"):
- RAG por **context stuffing** (todo o conteúdo da Base de Conhecimento
  injetado no prompt a cada pergunta), não busca vetorial/embeddings —
  adequado para dezenas de artigos; reavaliar se crescer para centenas
- Modelo padrão: **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`),
  configurável via `ANTHROPIC_MODEL`

### Base de Conhecimento

- Migration `20260825000001_base_conhecimento.sql`: enum
  `categoria_conhecimento` (produtos, especificações, processos,
  garantia, treinamentos — direto de `CONTEXTO.md` §17), tabela
  `artigos_conhecimento`, RLS (select unidade toda; insert/update/delete
  só gerente/auxiliar)
- `/conhecimento` — lista agrupada por categoria; `/conhecimento/[id]`
  — leitura com **markdown renderizado** (`react-markdown`, sem
  `dangerouslySetInnerHTML`); editor é textarea simples (sem WYSIWYG
  pesado — consistente com "evitar burocracia desnecessária",
  `CONTEXTO.md` §20)
- `ArtigoModal` — criar/editar unificado, mesmo padrão de render-prop
  trigger já usado em Acompanhamentos
- Exclusão com confirmação em duas etapas, mesmo padrão já usado antes

**Testado de verdade:** Postgres local com um vendedor e um gerente —
confirmei que o vendedor lê o artigo criado pelo gerente, e que a
tentativa de `INSERT` pelo vendedor é **rejeitada pela RLS** (não é só
o botão escondido na interface — o banco também recusa).

### Assistente IA

- `@ai-sdk/anthropic` + `ai` (Vercel AI SDK) + `@ai-sdk/react` — decidi
  usar esse SDK em vez de chamar a API da Anthropic na unha porque ele
  já resolve streaming + hook de chat (`useChat`) prontos, e é o
  caminho mais testado do ecossistema Next.js pra isso
- `POST /api/assistente/chat` — Route Handler que: (1) confirma sessão
  via client normal (RLS), (2) busca todos os artigos da Base de
  Conhecimento da unidade do usuário, (3) monta o system prompt com a
  filosofia confirmada ("organiza, analisa, sugere — nunca executa
  ações") + o conteúdo, (4) chama `streamText` e devolve a resposta em
  streaming
- `AssistenteChat` — UI com texto aparecendo incrementalmente (não tudo
  de uma vez no fim), indicador de "digitando" animado
- `isAnthropicConfigured()` — mesmo padrão do `isSupabaseConfigured()`
  (Etapa 6.1): tela amigável em vez de erro cru sem a chave configurada

**Bug real corrigido durante o build:** `convertToModelMessages` na
versão instalada do `ai` (v7) retorna uma `Promise`, diferente de
versões anteriores do SDK onde era síncrona — faltava `await`, pego
pelo TypeScript no build, não em produção.

**Testado de verdade:** `curl` em `/conhecimento`, `/assistente` e
`POST /api/assistente/chat` sem nenhuma chave configurada — todas
respondem de forma amigável (200/503 com mensagem clara), nenhuma
quebra com erro cru.

**Pendências conhecidas:**
- Sem histórico de conversas salvo — cada visita à página começa um
  chat novo (decisão de escopo pro MVP, não limitação técnica)
- Sem paginação/busca na Base de Conhecimento (ok pro volume esperado)
- Custo de API não tem trava/limite configurado — vale acompanhar o
  console da Anthropic nas primeiras semanas (`docs/ASSISTENTE_IA_SETUP.md`)

**Com isso, o MVP original completo (`CONTEXTO.md` §21) está
implementado.** Próximos passos dependem de uso real: o que a equipe
sentir falta no dia a dia é o sinal mais confiável de prioridade daqui
pra frente, mais do que qualquer suposição nossa agora.

---

## Etapa 10 — Ranking + Atividades + Edição/Exclusão de Acompanhamentos + Conversão de Seguro ✅ (concluída)

**Data:** 2026-08-25

Quatro entregas na mesma etapa, a pedido da Gi (Ranking, Atividades, e
os dois itens que antes tinham ficado de fora de propósito em
Acompanhamentos/Seguro — ela pediu para incluir).

### Ranking

**Bug de arquitetura real, achado antes de acontecer em produção:** a
view `ranking_mensal` (Etapa 6) usa `security_invoker=true` de
propósito, para respeitar RLS. Mas isso quebraria a regra confirmada em
`CONTEXTO.md` §6.1 — ranking é a exceção onde o vendedor **pode** ver o
agregado da equipe. Com a view direto, a RLS de `vendas` faria os
colegas do vendedor **sumirem completamente** do ranking (não
aparecerem restritos — sumirem, como se não tivessem vendido nada),
porque a RLS filtra linha a linha antes da agregação.

**Solução:** função `ranking_mensal_unidade()` (`SECURITY DEFINER`,
migration `20260824000006`), que roda com o privilégio do dono da
tabela (exímio de RLS por padrão), agrega **todas** as vendas da
unidade do usuário (via `unidade_atual()`, preservando o isolamento
entre unidades), mas só devolve nome + total + posição — nunca uma
linha de venda individual de outra pessoa. Testado em Postgres local
com dois vendedores: cada um só vê a própria venda em detalhe, mas
ambos veem o ranking completo dos dois.

**Página:** medalha para os 3 primeiros, valor total e quantidade de
vendas por vendedor.

### Atividades diárias

- Upsert por `(vendedor_id, data)` — salvar de novo no mesmo dia
  atualiza os números em vez de duplicar linha
- Vendedor: formulário com ligações (barra de progresso reage ao valor
  digitado, antes mesmo de salvar — meta de 50/dia), vídeos e leads
  recebidos (manual, sem integração com ChatGuru ainda)
- Gerente/auxiliar: lista de todos os vendedores da unidade, mesmo os
  que ainda não registraram nada hoje (aparecem com 0, não somem da
  lista — a query parte de `perfis`, não de `atividades_diarias`)
- Sem gap de RLS aqui — as policies de INSERT/UPDATE/SELECT já
  existiam desde a Etapa 6

### Acompanhamentos: editar e excluir

**Gap de RLS real, achado ao implementar:** só havia policy de
`SELECT`/`INSERT`/`UPDATE` em `acompanhamentos` — **faltava `DELETE`**.
Adicionada na mesma migration `20260824000006`.

- `AcompanhamentoModal` — modal único para criar **e** editar (mesmo
  formulário, `trigger` como render prop, evita duplicar JSX)
- `AcompanhamentoRowActions` — concluir, editar (abre o modal
  preenchido) e excluir por linha
- Exclusão com **confirmação em duas etapas dentro do próprio botão**
  (clique 1 vira "Confirmar?" em vermelho por 3s; clique 2 executa) em
  vez do `confirm()` nativo do navegador — mantém a experiência dentro
  do design system, sem um dialog do SO quebrando a continuidade visual

### Oportunidade de seguro: converter direto na tela

- `converterOportunidadeSeguro()` — marca `status = 'convertida'` e
  `data_conversao = hoje`. RLS de UPDATE já existia desde a Etapa 6,
  sem gap aqui.
- Botão "Convertido" na seção de oportunidades abertas da Agenda
- **O que continua de fora, de propósito:** nenhuma ação automática
  quando o prazo de 120 dias vence sem conversão — isso depende da
  regra `[A VALIDAR]` em `BUSINESS_RULES.md` §4 ("o que acontece com
  uma oportunidade expirada"), que ainda não foi confirmada

**Testado de verdade:**
- Postgres local: RLS + função de ranking com dois vendedores (ver
  acima) e policy de DELETE de acompanhamentos aplicada sem erro
- `npm run build`/`lint` limpos
- `curl` em `/ranking`, `/atividades` e `/agenda` sem `.env.local`
  preenchido — todas 200 com a tela de configuração pendente

**Pendências conhecidas:**
- Meta de vídeos ainda não definida (`CONTEXTO.md` §9) — só o contador
  existe, sem meta/progresso
- Sem paginação em nenhuma lista (ok para o volume atual)
- Ranking não distingue meses passados — só o mês corrente

**Próximo passo sugerido:** Base de Conhecimento ou Assistente IA são
os dois módulos que faltam do MVP original — ambos dependem de decisões
de escopo maiores (RAG, fonte de conteúdo) que vale conversar antes de
começar a codar.

---

## Etapa 9 — Metas + Agenda (Acompanhamentos) ✅ (concluída)

**Data:** 2026-08-24

Feitas juntas a pedido da Gi, para não perder tempo entre uma e outra —
mas são dois módulos independentes, documentados separadamente aqui.

### Metas

**Gap real que apareceu ao implementar:** a tabela `metas_mensais` só
tinha policy de `SELECT` desde a Etapa 6 — **ninguém conseguia criar a
própria meta do mês**, nem o vendedor. Sem isso, a view
`metas_progresso` (que faz `LEFT JOIN` a partir de `metas_mensais`)
nunca teria nada pra mostrar.

**O que foi feito:**
- Migration `20260824000005_metas_insert.sql` — policy de INSERT:
  vendedor cria a própria linha, gerente/auxiliar criam para qualquer
  vendedor da unidade
- `app/(dashboard)/metas/data.ts` — `garantirMetaDoMes()` e
  `garantirMetasDaUnidade()`: provisionam a linha do mês sob demanda
  (na primeira visita à página), aplicando a fórmula de déficit já
  documentada em `BUSINESS_RULES.md` §1.2 (`deficit_novo = saldo
  faltante do mês anterior, se a comissão não foi liberada`)
- `MetaVendedor` — vendedor vê a própria meta, valor vendido, barra de
  progresso e quanto falta para liberar a comissão
- `MetasEquipe` — gerente/auxiliar veem todos os vendedores da unidade,
  ordenados por valor vendido

**Testado de verdade:** simulei em Postgres local um vendedor com
déficit de R$30.000 no mês anterior (mesmo exemplo do
`BUSINESS_RULES.md`) e confirmei que o INSERT do mês atual — feito
pelo próprio vendedor via RLS, não por admin — herda os R$30.000
corretamente como `deficit_anterior`.

**Decisão de implementação (não é regra de negócio nova):**
provisionamento é sob demanda (lazy, na visita à página), não um cron
agendado — razoável para 3 vendedores. Se o time crescer ou ninguém
abrir a página em um mês inteiro, vale trocar por um job agendado
(Supabase Edge Function + `pg_cron`) sem mudar o schema.

### Agenda (Acompanhamentos)

**O que foi feito:**
- `app/(dashboard)/agenda/actions.ts` — `criarAcompanhamento()` e
  `concluirAcompanhamento()` (ação rápida, sem modal)
- `AcompanhamentosList` — pendentes primeiro, concluídos com
  strikethrough, RLS decide o recorte (vendedor vê os que é
  responsável; gerente/auxiliar veem todos da unidade)
- `NovoAcompanhamentoButton` — modal com cliente, tipo (follow-up,
  retorno, seguro, revisão, pós-venda, outro), data e descrição opcional
- **`OportunidadesSeguro`** — seção somente leitura no topo da agenda,
  puxando as oportunidades criadas automaticamente pelo módulo de
  Vendas (Etapa 8). Mostra dias restantes até o limite de 120 dias,
  com destaque visual quando restam ≤15 dias. Essa é a conexão real
  entre os dois módulos que eu tinha prometido.

**Pendências conhecidas (de ambos os módulos):**
- Sem edição/exclusão de acompanhamento — só criar e concluir
- Oportunidade de seguro continua só leitura aqui — converter/expirar
  ainda depende das regras `[A VALIDAR]` do `BUSINESS_RULES.md` §4
- Metas: sem histórico de meses anteriores na tela (só o mês atual)

**Próximo passo sugerido:** Ranking (view `ranking_mensal` já existe
desde a Etapa 6, mesma situação de "só falta a tela" que Metas tinha) ou
Atividades diárias (ligações/vídeos, meta de 50/dia).

---

## Etapa 8 — Vendas ✅ (concluída)

**Data:** 2026-08-24

**Decisões confirmadas com Gi antes de implementar:**
- Quem registra a venda: **só o próprio vendedor** (como já estava na
  RLS desde a Etapa 6 — só confirmamos que não mudaria)
- Modelo da moto: **texto livre** por enquanto (sem catálogo fixo)
- Ao registrar venda sem seguro: **cria a oportunidade de seguro
  automaticamente** (janela de 120 dias, regra já confirmada em
  `BUSINESS_RULES.md` §2.2)

**O que foi feito:**
- `app/(dashboard)/vendas/actions.ts` — `criarVenda()`: confere que
  quem está chamando tem `papel = 'vendedor'` (mensagem melhor que o
  403 cru da RLS), valida valor/forma de pagamento, insere a venda e,
  se `seguro_contratado` for falso, insere a oportunidade de seguro na
  sequência (mesma transação lógica, sem desfazer a venda se só a
  oportunidade falhar — a venda em si é o dado mais importante)
- `VendasList` — Server Component com nome do cliente resolvido à
  parte (evita depender de tipos de `join`/embed do Supabase no
  `Database` manual), valor formatado em BRL, badge "Sem seguro" quando
  aplicável
- `NovaVendaButton` — modal com select de cliente (populado pela page,
  sem ida extra ao banco), modelo/cor, valor, forma de pagamento e
  checkbox de seguro
- Componente `Checkbox` novo no design system (reutilizável para
  revisão concluída, etc. no futuro)
- Botão "Nova venda" só aparece para vendedores; se o vendedor ainda
  não tem nenhum cliente cadastrado, o botão vira um link para
  `/clientes` em vez de abrir um modal com select vazio

**Bug real encontrado e corrigido (não só no papel):**
- **`useId()` chamado condicionalmente** no `Checkbox`
  (`id ?? React.useId()`) — o `??` só executa o lado direito quando
  necessário, violando a regra de que Hooks precisam rodar sempre na
  mesma ordem. Pego pelo lint (`react-hooks/rules-of-hooks`), corrigido
  chamando `useId()` incondicionalmente e só decidindo qual valor usar
  depois.
- **CSS quebrado no Checkbox**: o ícone de check ficava dentro do
  `<span>` que reage ao estado do input — mas `peer-checked` do
  Tailwind só alcança **irmãos diretos** do elemento marcado, não
  descendentes de um irmão. O ícone nunca apareceria. Troquei para
  `group-has-[:checked]` (usa `:has()`, funciona em qualquer
  profundidade dentro do `group`).
- **`Button` não suporta `asChild`** (não instalamos Radix) — tentei
  usar esse padrão para o link "Cadastre um cliente primeiro" e
  corrigi para um `<Link>` estilizado diretamente.

**Testado de verdade:** `npm run build`/`lint` limpos, e `curl` em
`/vendas` sem `.env.local` preenchido confirma 200 com a tela de
configuração pendente (mesmo padrão das outras rotas).

**Pendências conhecidas:**
- Edição/exclusão de venda não implementada — só criação e leitura
- Sem paginação na lista (ok para volume atual de 3 vendedores; revisar
  se crescer)

**Próximo passo sugerido:** Metas (já dá pra usar a view
`metas_progresso` criada na Etapa 6) ou Acompanhamentos (que já ganham
as oportunidades de seguro criadas automaticamente por este módulo).

---

## Etapa 7 — Gestão de Equipe ✅ (concluída)

**Data:** 2026-08-24

**Decisões confirmadas com Gi antes de implementar:**
- Quem pode criar/convidar usuários: **gerente E auxiliar administrativa**
  (não só gerente)
- Como o novo usuário recebe acesso: **quem cria já define uma senha
  temporária e repassa manualmente** — sem depender de SMTP configurado
  no Supabase (mais simples para uma equipe pequena)

**O que foi feito:**
- `src/lib/supabase/admin.ts` — client administrativo com a chave
  `service_role`, protegido por `import "server-only"` (o build falha
  se alguém tentar importar isso num Client Component). Único lugar do
  projeto que usa essa chave.
- `SUPABASE_SERVICE_ROLE_KEY` adicionada ao `.env.example`/`.env.local`
  e documentada em `docs/SUPABASE_SETUP.md`
- Migration `20260824000004_perfis_gestao.sql` — estende a policy de
  leitura de `perfis` para incluir `auxiliar_administrativa` (antes só
  gerente via)
- `app/(dashboard)/equipe/actions.ts` — `criarUsuario()`: primeiro
  confirma a permissão de quem está chamando usando o client normal
  (RLS/`auth.uid()`), só then usa o client admin para criar o usuário
  em `auth.users` (`email_confirm: true`, sem exigir confirmação por
  e-mail) e o perfil correspondente. Se o perfil falhar depois do
  usuário já criado, desfaz (`deleteUser`) para não deixar usuário
  "fantasma".
- Página `/equipe`: lista a equipe da unidade + botão "Convidar
  usuário" com modal de duas telas — formulário, depois confirmação
  mostrando e-mail/senha para copiar (a senha não aparece de novo
  depois disso). Gerador de senha temporária no navegador
  (`crypto.getRandomValues`), editável antes de salvar.
- Item "Equipe" no menu lateral só aparece para gerente/auxiliar
  (`config/nav.ts` ganhou um campo `papeis` opcional por item;
  `Sidebar` filtra)
- **Defesa em profundidade**: mesmo com o item escondido do menu, a
  página `/equipe` confere o papel de novo no servidor e mostra "Acesso
  restrito" para quem tentar acessar a URL direto (vendedor)

**Testado de verdade:** apliquei a nova migration num Postgres local
junto com as 3 anteriores e simulei RLS com dois vendedores + uma
auxiliar administrativa — confirmei que um vendedor só vê o próprio
perfil, e a auxiliar vê a equipe inteira da unidade. Também testei com
`curl` que `/equipe` não quebra sem `.env.local` preenchido (mesma
tela de configuração pendente das outras rotas).

**Decisões importantes:**
- **Autorização é checada no código da Server Action, não em RLS** —
  porque a criação de usuário passa pelo client admin, que ignora RLS
  por definição. A regra de "quem pode criar" vive em
  `PAPEIS_QUE_PODEM_CRIAR` dentro da action, checada contra o papel do
  chamador obtido via client normal.
- **Sem policy de INSERT em `perfis`** — de propósito. Criar um perfil
  sem o usuário existir em `auth.users` não faz sentido (FK), e criar o
  usuário exige a Admin API de qualquer forma. Não há caminho de
  inserção "pelo client normal" que faça sentido aqui.

**Pendências conhecidas:**
- Sem edição de papel/remoção de usuário ainda — só criação e listagem
- Sem fluxo de "esqueci minha senha" (também depende de e-mail/SMTP,
  mesma decisão de escopo desta etapa)
- **O primeiro gerente precisa ser criado manualmente** pelo painel do
  Supabase (Authentication > Users + insert em `perfis`) — o fluxo de
  `/equipe` resolve o "segundo usuário em diante", mas não o
  bootstrap. Passo a passo em `docs/SUPABASE_SETUP.md` §6.

**Próximo passo sugerido:** módulo de Vendas.

---

## Etapa 6.1 — Clientes real + Login + resiliência de config ✅ (concluída)

**Data:** 2026-08-24

**O que foi feito:**
- **Login real** via Supabase Auth (`signInWithPassword`), Server Action
  + `useActionState`, em `app/(auth)/login/`
- **Logout** funcional no Header via Server Action
- **Proteção de rota**: `(dashboard)/layout.tsx` verifica sessão no
  servidor e redireciona para `/login` sem usuário autenticado; busca
  nome do perfil e da unidade reais para o Header
- **Clientes com CRUD real**: lista via Server Component + `Suspense` +
  skeleton; modal "Novo cliente" com todos os campos do CRM
  (nome, CPF, telefone, e-mail, nascimento, endereço, CEP, bairro),
  motion completo, toast de sucesso
- `src/types/database.ts` — tipos do banco escritos manualmente a
  partir das migrations (regenerar com `supabase gen types` quando
  linkado a um projeto real)
- **Resiliência de configuração**: sem `.env.local` preenchido, o app
  antes quebrava com 500 em **toda rota** (o `proxy.ts` roda em todo
  request). Agora mostra uma tela amigável apontando para
  `docs/SUPABASE_SETUP.md` em vez de crashar.

**Bugs reais encontrados e corrigidos (não só "no papel" — testados):**
1. **Tipagem caía em `never`** em todas as queries do Supabase — faltava
   `Relationships: []` em cada tabela/view do tipo `Database`
   (`@supabase/postgrest-js` exige essa chave para casar a forma
   esperada; sem ela, a inferência de tipos falha silenciosamente).
2. **`setState` dentro de `useEffect`** no modal de novo cliente —
   sinalizado pelo lint do React 19 (`react-hooks/set-state-in-effect`).
   Corrigido chamando a Server Action imperativamente dentro de
   `startTransition`, decidindo o que fazer com o resultado de forma
   síncrona em vez de sincronizar via efeito.
3. **App inteiro em 500 sem `.env.local`** — testado com `curl` antes e
   depois da correção: antes, `/login`, `/dashboard` e `/clientes`
   todos retornavam 500; depois, todos retornam 200, com uma mensagem
   clara de configuração pendente.

**Decisões importantes:**
- **`isSupabaseConfigured()`** centraliza a checagem de env vars — usada
  no `proxy.ts` (pula renovação de sessão), no `(dashboard)/layout.tsx`
  (mostra tela de aviso) e na action de login (erro amigável em vez de
  stack trace).
- **`ClientesList` usa `unidade_atual()` via RPC** para inserir o
  cliente na unidade certa — reaproveita a mesma função SQL das
  policies de RLS, em vez de duplicar essa lógica no client.
- **Cadastro de cliente trata `23505` (unique_violation) explicitamente**
  — vira "Já existe um cliente com esse CPF nesta unidade" em vez de
  erro genérico, usando a constraint já criada na Etapa 6.

**Pendências conhecidas:**
- Ainda não existe fluxo de **criação de perfil/convite de usuário** —
  hoje, criar um vendedor/gerente exige inserir manualmente em
  `auth.users` + `perfis` pelo painel do Supabase. Isso é trabalho de
  produto (quem convida quem, com qual papel) ainda não definido.
- Edição e exclusão de cliente não implementadas — só criação e leitura
  por enquanto.

**Próximo passo sugerido:** módulo de Vendas (é o que mais depende de
Clientes já existir) ou o fluxo de convite/criação de usuários — o que
fizer mais sentido pro dia a dia de vocês primeiro.

---

## Etapa 6 — Modelagem do Banco de Dados ✅ (concluída)

**Data:** 2026-08-24

**O que foi feito:**
- CLI oficial do Supabase instalada (`npx supabase`) e `supabase init`
  rodado — estrutura `supabase/config.toml` + `supabase/migrations/`
- **3 migrations** em `supabase/migrations/`:
  1. `schema_inicial.sql` — 6 enums, 9 tabelas, índices, triggers de
     `updated_at`
  2. `views.sql` — `ranking_mensal` e `metas_progresso` (leitura
     derivada, não duplicada)
  3. `rls.sql` — Row Level Security em todas as tabelas + 2 funções
     auxiliares (`unidade_atual()`, `papel_atual()`)
- `supabase/seed.sql` — insere a unidade Piratininga para dev local
- **Testado de verdade**: subi um Postgres local, apliquei as 3
  migrations + seed do zero, inseri dados de exemplo e conferi que
  `metas_progresso` bate exatamente com o exemplo do
  `BUSINESS_RULES.md` (meta 200k, vendido 170k → déficit 30k, comissão
  não liberada) e que a janela de `oportunidades_seguro` dá exatos 120
  dias. Também simulei dois vendedores diferentes com RLS ativo e
  confirmei que cada um só vê a própria venda — isolamento funcionando,
  não é só "parece certo no papel".

**Entidades:** `unidades`, `perfis`, `clientes`, `vendas`,
`metas_mensais`, `oportunidades_seguro`, `revisoes`, `acompanhamentos`,
`atividades_diarias`. Diagrama completo com decisões de modelagem foi
apresentado e aprovado antes de escrever qualquer SQL (ver histórico da
conversa — não fica salvo em arquivo, mas as decisões abaixo cobrem o
essencial).

**Decisões importantes:**
- **`perfis` estende `auth.users`**, não duplica autenticação — só
  guarda `papel` e `unidade_id`.
- **Ranking e progresso de metas são `views`, não tabelas** — evitam
  duplicar a fonte de verdade (`vendas`). `metas_progresso` já aplica a
  fórmula de déficit confirmada:
  `comissao_liberada = vendido >= meta + déficit_anterior`.
- **Views criadas com `security_invoker = true`** — sem isso, uma view
  no Postgres roda com a permissão de quem a *criou*, não de quem
  consulta, e isso vazaria dados entre unidades ignorando a RLS. Detalhe
  fácil de esquecer e que testei explicitamente.
- **RLS implementa CONTEXTO.md §6 ao pé da letra**: vendedor vê/edita o
  que é seu (vendas, metas, atividades, oportunidades, acompanhamentos
  como responsável); gerente e auxiliar administrativa veem tudo da
  própria unidade. `clientes` é compartilhado dentro da unidade (CRM
  único, não por vendedor) — o `CONTEXTO.md` não diferencia clientes por
  vendedor, só vendas.
- **CPF único por unidade quando preenchido** — decisão técnica (CPF é
  identificador nacional, duplicidade é sempre um bug), não a regra de
  negócio de "qual campo prevalece" (que continua `[A VALIDAR]`).
- **`data_limite` de oportunidade de seguro é `date`, não `timestamptz`**
  — Postgres não aceita expressão `timestamptz + interval` como coluna
  gerada (não é "immutable"). `date + integer` resolve e faz sentido
  para uma regra em dias corridos.
- **`oportunidades_seguro.venda_id` é `unique`** — no máximo uma
  oportunidade por venda, refletindo que a decisão de contratar seguro
  acontece uma vez, no momento da venda.

**Pendências conhecidas (de propósito, ligadas ao `[A VALIDAR]`):**
- Sem lógica automática de expirar oportunidade após 120 dias (precisa
  de um job/cron — Supabase Edge Function ou `pg_cron`, decisão de
  implementação futura)
- Sem view de cálculo de comissão de seguro (R$50/R$150 por faixa) —
  regra confirmada, mas cálculo fica para quando o módulo de seguro for
  implementado de fato, não faz parte da modelagem pura
- Sem contagem/teto de revisões por venda

**Próximo passo sugerido:** conectar as telas (`clientes`, `vendas`,
`metas`, etc.) às tabelas reais via os clients do Supabase já
configurados — puxando o placeholder `EmptyState` para um estado real
com dados (ou continuando `EmptyState` até ter dados de verdade).

---

## Etapa 5 — Setup do Supabase ✅ (concluída)

**Data:** 2026-08-23

**O que foi feito:**
- Instalado `@supabase/supabase-js` e `@supabase/ssr`
- `src/lib/supabase/client.ts` — client para Client Components (browser),
  usa a chave `anon`
- `src/lib/supabase/server.ts` — client para Server Components/Server
  Actions, lê/escreve sessão via cookies do Next.js
- `src/lib/supabase/proxy.ts` + `src/proxy.ts` — renovação
  automática de sessão a cada request, **sem** lógica de redirecionamento
  ou proteção de rota (isso depende do módulo de permissões, ainda não
  definido). `proxy.ts` é a convenção do Next.js 16 (sucessora do antigo
  `middleware.ts` — migramos com o codemod oficial `@next/codemod
  middleware-to-proxy`)
- `.env.example` (referência) e `.env.local` (placeholder vazio,
  ignorado pelo git) com `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `docs/SUPABASE_SETUP.md` — guia passo a passo pra Gi criar o projeto no
  painel do Supabase e preencher as variáveis

**Decisões importantes:**
- **Chave `anon`, nunca `service_role`**, em qualquer código deste
  projeto — a `service_role` ignora RLS e não deve existir fora de
  contextos administrativos isolados (nem chegamos a precisar dela
  ainda).
- **Middleware só renova sessão, não protege rotas** — proteger
  `/dashboard/*` por login é uma decisão de produto (o que cada papel
  pode ver) que depende do módulo de usuários/permissões, fora do
  escopo desta etapa.
- **Nenhuma tabela criada ainda** — Supabase está "plugado" mas vazio de
  propósito. Schema é a Etapa 6, depois de validar o domínio de
  clientes/vendas/oportunidades.

**Pendências conhecidas:**
- Gi precisa criar o projeto real no Supabase e preencher o
  `.env.local` (`docs/SUPABASE_SETUP.md` tem o passo a passo)
- Login em `/login` continua sendo só o shell visual — falta plugar
  `supabase.auth.signInWithPassword` (ou o método escolhido) nele

**Próximo passo sugerido:** Etapa 6 — Modelagem do banco de dados
(clientes, vendas, metas/déficit, oportunidades de seguro, revisões),
usando `docs/BUSINESS_RULES.md` como base.

---

## Etapa 1 — Fundação do Projeto ✅ (concluída)

**Data:** 2026-08-23

**O que foi feito:**
- Projeto Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 criado
- Instalado: `motion` (Framer Motion v13, import via `motion/react`), `geist`
  (fonte local, evita dependência de `fonts.googleapis.com` no build),
  `clsx` + `tailwind-merge` (helper `cn()`), `lucide-react` (ícones)
- Estrutura de pastas feature-based (`app`, `components/{ui,layout,shared}`,
  `features/*`, `lib`, `types`, `config`, `hooks`, `docs`)
- Design system inicial: `Button`, `Card`, `Input`, `Badge`, `Skeleton`,
  `ProgressBar`, `Toast`/`ToastProvider`
- Layout da área logada: `Sidebar` (com indicador ativo animado via
  `layoutId`), `Header`, `DashboardShell`, `PageTransition`
- Todas as páginas dos módulos futuros criadas como placeholder
  (`EmptyState`) — sem lógica de negócio
- Dashboard usa um padrão real de lazy loading: `StatsWidget` é um Server
  Component assíncrono renderizado dentro de `<Suspense>`, com
  `StatsWidgetSkeleton` como fallback (streaming SSR nativo do App Router)
- Shell visual de login em `(auth)/login` — **sem** lógica de autenticação
- Motion segue o skill `kylezantos/design-motion-principles`, ponderado
  como SaaS dashboard: **Emil Kowalski (primário) + Jakub Krehel
  (secundário)**. Toda animação respeita `prefers-reduced-motion`, anima
  só `transform`/`opacity`/`filter`, usa curvas customizadas.

**Decisões importantes:**
- **Sem dark mode nesta etapa** — o `globals.css` do `create-next-app` trazia
  dark mode automático por `prefers-color-scheme`; foi removido em favor de
  um design system light-first intencional. Pode voltar depois como decisão
  deliberada, não como default do template.
- **Fonte local (Geist) em vez de `next/font/google`** — evita qualquer
  dependência de rede externa não essencial no build.
- **`AnimatePresence` em modo "sync" (padrão), não "wait"**, no
  `PageTransition` — com "wait" a navegação parece mais lenta porque soma
  a duração da saída + a da entrada; um dashboard de uso diário pede a
  transição mais rápida possível.
- **Server Component + `Suspense` para lazy loading**, não `next/dynamic`
  — é o padrão idiomático do App Router para dados assíncronos e não
  exige marcar nada como Client Component.

**Pendências conhecidas (não é dívida técnica, é escopo da etapa):**
- Sem autenticação real, sem Supabase, sem banco de dados
- Sem CRUD funcional em nenhum módulo
- `types/`, `hooks/`, `features/*` existem como pastas mas estão vazias —
  serão preenchidas junto com a modelagem de dados (Etapa 6)

**Próximo passo sugerido:** Etapa 5 — Setup do Supabase (projeto, client,
variáveis de ambiente) antes de modelar o banco na Etapa 6. **(ver seção
"Etapa 5" acima, já concluída.)**

---

## Regras de negócio já confirmadas

Ver `docs/BUSINESS_RULES.md` para o detalhamento. Resumo rápido:

- **Déficit/comissão:** para liberar 1% de comissão, o vendedor precisa
  quitar o déficit acumulado **e** bater a meta do mês (R$ 200.000).
- **Seguro:** R$ 50 por seguro fechado; R$ 150 por seguro a partir do 10º
  fechado no mês. Oportunidade = cliente que não fechou na hora, com
  janela de conversão de até 120 dias.
- **Revisão:** a cada 3 meses OU 2.000 km rodados, o que ocorrer primeiro.

Pontos ainda `[A VALIDAR]` estão listados em `BUSINESS_RULES.md` seção 4 —
não devem ser assumidos na modelagem do banco (Etapa 6).

---

## Convenções do projeto

- Documentos de contexto/decisão ficam em `docs/`, versionados junto do
  código (não é wiki externo).
- Comentários de código em português quando explicam uma decisão de
  negócio; nomes de variáveis/funções em inglês (convenção do
  ecossistema JS/TS).
- Todo componente com motion carrega o comentário de qual designer
  (Emil/Jakub/Jhey) inspirou a decisão e por quê — facilita auditoria
  futura sem reabrir o skill inteiro.

## Etapa 18 — Vendas (acessórios, 1x–21x, filtro por data, excluir/editar sem F5) + mobile

- Migration `20260831000001_vendas_acessorios.sql`: `acessorios` (jsonb) e `valor_acessorios` em `vendas`. Valor dos acessórios NUNCA soma em `vendas.valor` (ranking/metas/dashboard seguem só com o veículo); relatórios mostram acessórios em card e linha separados.
- Catálogo em `src/config/acessorios.ts` (preço vem do servidor, não do form).
- Lista de vendas usa estado local (`vendas-list-client.tsx`): `excluirVenda` retorna `{error}` e `atualizarVenda`/`criarVenda` retornam a venda; linha some/atualiza na hora. `revalidatePath` mantido como reforço.
- Filtro `?de=&ate=` em `/vendas` (Suspense com `key`).
- Mobile: `mobile-nav.tsx` (drawer < md), Header compacto, `min-w-0` no shell, grids de modais `grid-cols-1 sm:grid-cols-2`.
