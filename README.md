# Motochefe Nexus

Plataforma interna de gestão comercial da unidade Motochefe Piratininga.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev) (Framer Motion) para animações
- Supabase — **ainda não conectado** (entra na Etapa 5)

## Setup do Supabase

Antes de rodar o projeto pela primeira vez, siga `docs/SUPABASE_SETUP.md`
para criar o projeto no Supabase, preencher o `.env.local` e aplicar as
migrations em `supabase/migrations/`.

## Banco de dados

O schema completo (tabelas, RLS, views) já está escrito em
`supabase/migrations/`. Para aplicar no seu projeto Supabase:

```bash
npx supabase link --project-ref SEU-PROJECT-REF
npx supabase db push
```

Ver `docs/MEMORIA.md` (Etapa 6) para as decisões de modelagem e
`docs/BUSINESS_RULES.md` para as regras de negócio já implementadas
no schema (déficit/comissão, seguro, revisão).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — redireciona para `/dashboard`.

## Estrutura

```
src/
├── app/
│   ├── (auth)/                # login (shell visual, sem lógica)
│   └── (dashboard)/           # área logada: dashboard, clientes, vendas,
│                               # metas, ranking, agenda, atividades,
│                               # conhecimento, assistente
├── components/
│   ├── ui/                    # design system (Button, Card, Toast...)
│   ├── layout/                # Sidebar, Header, DashboardShell
│   └── shared/                # PageTransition, EmptyState
├── features/                  # lógica futura por domínio (vazio por ora)
├── lib/                       # utilitários (cn, futuros clients)
├── types/                     # tipos compartilhados
├── config/                    # nav.ts e outras constantes
└── hooks/                     # hooks reutilizáveis
```

## Estado atual (Etapa 11 — MVP completo)

- ✅ Estrutura de pastas, design system, layout e motion (Etapa 1)
- ✅ Clients do Supabase (browser + servidor + admin) e middleware de sessão
- ✅ Schema completo: 10 tabelas, RLS por papel/unidade, 2 views, 3 funções RPC
- ✅ Login/logout reais via Supabase Auth, rotas protegidas
- ✅ Clientes: CRUD real (criar + listar)
- ✅ Equipe: gerente/auxiliar podem criar usuários (senha temporária manual)
- ✅ Vendas: vendedor registra, cria oportunidade de seguro automaticamente
- ✅ Metas: progresso real com déficit herdado mês a mês
- ✅ Agenda: acompanhamentos com CRUD completo + conversão de oportunidade de seguro
- ✅ Ranking: agregado seguro por RPC, visível para toda a unidade
- ✅ Atividades diárias: ligações (meta 50/dia), vídeos, leads
- ✅ Base de Conhecimento: wiki interna com markdown, permissão por papel
- ✅ Assistente IA: chat real via Claude, com RAG sobre a Base de Conhecimento

**MVP original (`CONTEXTO.md` §21) completo.** Setup necessário antes
de usar em produção: `docs/SUPABASE_SETUP.md` (banco + primeiro
usuário) e `docs/ASSISTENTE_IA_SETUP.md` (chave da API do Gemini).

Ver `docs/CONTEXTO.md`, `docs/BUSINESS_RULES.md` e `docs/MEMORIA.md` para o
histórico de decisões do projeto.

## Motion

Este projeto segue os princípios do skill
[`design-motion-principles`](https://github.com/kylezantos/design-motion-principles),
ponderado como **SaaS dashboard**: Emil Kowalski (restrição/velocidade) como
lente primária, Jakub Krehel (polimento de produção) como secundária. Toda
animação:

- respeita `prefers-reduced-motion` (ver `globals.css`)
- anima apenas `transform` / `opacity` / `filter`
- usa curvas customizadas (nunca `ease` puro)
- é rápida (~160–350ms) por ser uma ferramenta de uso diário
