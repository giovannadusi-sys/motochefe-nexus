-- =========================================================
-- Motochefe Nexus — Histórico do Assistente IA (Etapa 17)
--
-- Cada usuário vê só o próprio histórico — não é uma ferramenta de
-- monitoramento do gerente sobre o que o vendedor pergunta, é uma
-- conveniência pessoal (retomar uma conversa). Se isso precisar mudar
-- no futuro, é uma decisão de produto a confirmar antes de alterar a
-- RLS abaixo.
-- =========================================================

create type public.papel_mensagem_ia as enum ('user', 'assistant');

create table public.mensagens_assistente (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  papel public.papel_mensagem_ia not null,
  conteudo text not null,
  created_at timestamptz not null default now()
);

comment on table public.mensagens_assistente is 'Histórico de conversas com o Assistente IA — cada usuário só vê o próprio.';

create index mensagens_assistente_usuario_id_idx on public.mensagens_assistente (usuario_id, created_at);

alter table public.mensagens_assistente enable row level security;

create policy "mensagens_assistente_select_proprio"
  on public.mensagens_assistente for select
  using (usuario_id = auth.uid());

create policy "mensagens_assistente_insert_proprio"
  on public.mensagens_assistente for insert
  with check (usuario_id = auth.uid() and unidade_id = public.unidade_atual());
