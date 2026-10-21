-- =========================================================
-- Motochefe Nexus — Base de Conhecimento (Etapa 11)
--
-- Decisão confirmada: Nexus hospeda o conteúdo estável diretamente
-- (wiki interna), em vez de só linkar pra plataforma de treinamento
-- existente. Categorias vêm direto de CONTEXTO.md §17 ("informações
-- relativamente estáveis"). Conteúdo dinâmico (preços, campanhas,
-- metas) NÃO entra aqui — já tem seus próprios módulos (Metas etc.)
-- ou ainda não tem uma estratégia de atualização definida.
--
-- Permissão confirmada: todos leem; só gerente/auxiliar administrativa
-- criam/editam/excluem.
-- =========================================================

create type public.categoria_conhecimento as enum (
  'produtos',
  'especificacoes',
  'processos',
  'garantia',
  'treinamentos'
);

create table public.artigos_conhecimento (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  categoria public.categoria_conhecimento not null,
  titulo text not null,
  conteudo text not null, -- markdown
  autor_id uuid not null references public.perfis (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.artigos_conhecimento is 'Conteúdo estável (produtos, specs, processos, garantia, treinamentos) — CONTEXTO.md §17. Conteúdo dinâmico não entra aqui.';

create index artigos_conhecimento_unidade_id_idx on public.artigos_conhecimento (unidade_id);
create index artigos_conhecimento_categoria_idx on public.artigos_conhecimento (categoria);

create trigger artigos_conhecimento_set_updated_at
  before update on public.artigos_conhecimento
  for each row execute function public.set_updated_at();

alter table public.artigos_conhecimento enable row level security;

-- Todos os papéis da unidade podem ler.
create policy "artigos_conhecimento_select_unidade"
  on public.artigos_conhecimento for select
  using (unidade_id = public.unidade_atual());

-- Só gerente/auxiliar criam, editam e excluem.
create policy "artigos_conhecimento_insert_gestao"
  on public.artigos_conhecimento for insert
  with check (
    unidade_id = public.unidade_atual()
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );

create policy "artigos_conhecimento_update_gestao"
  on public.artigos_conhecimento for update
  using (
    unidade_id = public.unidade_atual()
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );

create policy "artigos_conhecimento_delete_gestao"
  on public.artigos_conhecimento for delete
  using (
    unidade_id = public.unidade_atual()
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );
