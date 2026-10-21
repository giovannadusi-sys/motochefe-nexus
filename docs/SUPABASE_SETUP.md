# Setup do Supabase — Etapa 5

Guia para deixar o projeto conectado ao Supabase. Nenhuma tabela é criada
aqui — isso é a Etapa 6 (modelagem do banco), depois que o domínio de
clientes/vendas/oportunidades estiver validado.

## 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (ou entre)
   com o e-mail que vai administrar o projeto.
2. **New Project** → escolha uma organização (crie "Motochefe" se ainda
   não existir).
3. Preencha:
   - **Name:** `motochefe-nexus` (ou `motochefe-nexus-dev`, se quiser
     separar do ambiente de produção mais tarde)
   - **Database Password:** gere uma senha forte e **guarde num
     gerenciador de senhas** — ela não é a chave usada no app, mas dá
     acesso direto ao Postgres.
   - **Region:** escolha a mais próxima dos usuários finais (ex: `South
     America (São Paulo)`, se disponível — reduz a latência para quem
     acessa do Brasil).
4. Aguarde o projeto provisionar (leva 1–2 minutos).

## 2. Pegar as chaves da API

No painel do projeto: **Project Settings** (ícone de engrenagem) → **API**.

Você vai precisar de dois valores:
- **Project URL** → algo como `https://xxxxxxxxxxxx.supabase.co`
- **anon / public key** → uma chave longa (JWT) — é seguro expor no
  frontend, ela é limitada pelas regras de RLS que vamos criar quando as
  tabelas existirem (Etapa 6)
- **service_role key** → também uma chave longa (JWT), mas **secreta**.
  Usada em um único lugar do projeto (`src/lib/supabase/admin.ts`), para
  criar novos usuários (Etapa 7 — gestão de equipe). Ela ignora toda
  regra de segurança do banco — nunca deve aparecer no navegador nem em
  nenhuma variável com prefixo `NEXT_PUBLIC_`.

## 3. Preencher as variáveis de ambiente

No arquivo `.env.local` (já criado na raiz do projeto, vazio de propósito):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

Esse arquivo **não deve ser commitado** (já está protegido pelo
`.gitignore`). O `.env.example` existe só como referência de quais
variáveis o projeto espera.

## 4. Validar a conexão

Com o servidor rodando (`npm run dev`), abra o console do navegador em
`http://localhost:3000` e rode:

```js
fetch("https://SEU-PROJETO.supabase.co/rest/v1/", {
  headers: { apikey: "SUA-CHAVE-ANON" }
}).then(r => console.log(r.status));
```

Um status `200` confirma que a URL e a chave estão corretas.

## 5. Aplicar as migrations (schema do banco)

O schema já está pronto em `supabase/migrations/` (Etapa 6). Para
aplicar no seu projeto real:

```bash
# Conecta a CLI local ao seu projeto (pede o Project Ref, que fica na
# URL do projeto: https://SEU-PROJECT-REF.supabase.co)
npx supabase link --project-ref SEU-PROJECT-REF

# Aplica as 3 migrations (schema, views, RLS) no banco remoto
npx supabase db push
```

A CLI vai pedir a senha do banco (a que você definiu no passo 1).

Depois disso, rode o `seed.sql` manualmente pelo **SQL Editor** do
painel do Supabase (ele não roda sozinho em produção):

```sql
insert into public.unidades (empresa_nome, nome)
values ('Motochefe', 'Piratininga');
```

**Conferir se funcionou:** no painel do Supabase, aba **Table Editor**,
devem aparecer 9 tabelas (`unidades`, `perfis`, `clientes`, `vendas`,
`metas_mensais`, `oportunidades_seguro`, `revisoes`,
`acompanhamentos`, `atividades_diarias`) e a tabela `unidades` com uma
linha ("Piratininga").

## 6. Criar o primeiro usuário (bootstrap)

O app tem um fluxo de convite em `/equipe` (Etapa 7), mas ele só
funciona se já existir um **gerente logado** para convidar as próximas
pessoas. Para o primeiro acesso, esse gerente precisa ser criado
manualmente pelo painel — nunca inserindo direto em `auth.users` via
SQL (o Supabase não recomenda; a senha precisa passar pelo hash certo).

1. **Authentication > Users > Add user > Create new user** — preencha
   e-mail e senha. Marque **"Auto Confirm User"** (sem isso, o login
   falha por falta de confirmação de e-mail, já que não há SMTP
   configurado).
2. Copie o **UUID** do usuário criado (aparece na página de detalhes
   dele).
3. **Table Editor > perfis > Insert row**, preenchendo:
   - `id` = o UUID copiado
   - `unidade_id` = o `id` da linha "Piratininga" em `unidades`
   - `papel` = `gerente`
   - `nome` = seu nome
4. Faça login em `/login` com o e-mail/senha do passo 1.

A partir daí, esse usuário pode usar "Convidar usuário" em `/equipe`
para criar todo o resto da equipe.

## O que já está pronto no código

- `src/lib/supabase/client.ts` — client para Client Components (browser)
- `src/lib/supabase/server.ts` — client para Server Components/Actions
- `src/lib/supabase/proxy.ts` + `src/proxy.ts` — mantém a sessão
  renovada automaticamente a cada request (infraestrutura, sem lógica de
  redirecionamento/proteção de rota ainda — isso depende do módulo de
  permissões por unidade). `proxy.ts` é a convenção atual do Next.js 16
  para esse tipo de arquivo (antigo `middleware.ts`).

## O que NÃO está pronto (de propósito)

- Nenhum fluxo de login real — o shell visual existe em `/login`, mas o
  `Supabase Auth` (e-mail/senha, ou o método que vocês decidirem) ainda
  não está plugado nele
- Nenhuma tela consome as tabelas reais ainda — os módulos continuam
  mostrando `EmptyState` até serem conectados aos dados
- Expiração automática de oportunidades de seguro após 120 dias (precisa
  de um job agendado — não faz parte do schema em si)
