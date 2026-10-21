-- =========================================================
-- Motochefe Nexus — Row Level Security (Etapa 6)
--
-- Implementa CONTEXTO.md §6: vendedor acessa o que é "seu";
-- gerente acessa tudo dentro da própria unidade. Sem policy
-- de INSERT/UPDATE/DELETE ainda além do essencial — regras
-- de edição mais finas (ex: pode editar venda depois de X
-- dias?) não foram discutidas e ficam para depois.
-- =========================================================

-- ---------------------------------------------------------
-- Funções auxiliares — evitam repetir a mesma subquery em
-- toda policy e concentram a leitura do perfil num só lugar.
-- `security definer` + search_path fixo: rodam com permissão
-- de leitura de public.perfis, mas continuam limitadas ao
-- próprio auth.uid() (não recebem parâmetros externos).
-- ---------------------------------------------------------

create or replace function public.unidade_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unidade_id from public.perfis where id = auth.uid();
$$;

create or replace function public.papel_atual()
returns public.papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where id = auth.uid();
$$;

-- ---------------------------------------------------------
-- Habilitar RLS em todas as tabelas de domínio
-- ---------------------------------------------------------

alter table public.unidades enable row level security;
alter table public.perfis enable row level security;
alter table public.clientes enable row level security;
alter table public.vendas enable row level security;
alter table public.metas_mensais enable row level security;
alter table public.oportunidades_seguro enable row level security;
alter table public.revisoes enable row level security;
alter table public.acompanhamentos enable row level security;
alter table public.atividades_diarias enable row level security;

-- ---------------------------------------------------------
-- UNIDADES — leitura da própria unidade apenas.
-- Criação/edição de unidades é tarefa administrativa (fora do
-- app, via service_role) — sem policy de escrita aqui.
-- ---------------------------------------------------------

create policy "unidades_select_propria"
  on public.unidades for select
  using (id = public.unidade_atual());

-- ---------------------------------------------------------
-- PERFIS — usuário vê o próprio perfil; gerente vê os perfis
-- da própria unidade (para listar a equipe, ranking etc.).
-- ---------------------------------------------------------

create policy "perfis_select_proprio_ou_gerente"
  on public.perfis for select
  using (
    id = auth.uid()
    or (public.papel_atual() = 'gerente' and unidade_id = public.unidade_atual())
  );

create policy "perfis_update_proprio"
  on public.perfis for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------
-- CLIENTES — CRM é compartilhado dentro da unidade
-- (CONTEXTO.md §10 não restringe cliente a um vendedor
-- específico). Vendedor e gerente da mesma unidade veem os
-- mesmos clientes; auxiliar administrativa também.
-- ---------------------------------------------------------

create policy "clientes_select_unidade"
  on public.clientes for select
  using (unidade_id = public.unidade_atual());

create policy "clientes_insert_unidade"
  on public.clientes for insert
  with check (unidade_id = public.unidade_atual());

create policy "clientes_update_unidade"
  on public.clientes for update
  using (unidade_id = public.unidade_atual())
  with check (unidade_id = public.unidade_atual());

-- ---------------------------------------------------------
-- VENDAS — vendedor vê e cria as próprias vendas; gerente e
-- auxiliar administrativa veem todas as vendas da unidade
-- (CONTEXTO.md §6.1 "suas vendas" vs §6.2 "faturamento por
-- vendedor").
-- ---------------------------------------------------------

create policy "vendas_select_proprio_ou_gestao"
  on public.vendas for select
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

create policy "vendas_insert_proprio"
  on public.vendas for insert
  with check (
    vendedor_id = auth.uid()
    and unidade_id = public.unidade_atual()
  );

-- ---------------------------------------------------------
-- METAS_MENSAIS — mesma lógica de vendas: vendedor vê a
-- própria; gerente/auxiliar veem a unidade toda.
-- ---------------------------------------------------------

create policy "metas_mensais_select_proprio_ou_gestao"
  on public.metas_mensais for select
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

-- ---------------------------------------------------------
-- OPORTUNIDADES_SEGURO — mesmo padrão de vendas, pelo
-- vendedor responsável pela oportunidade.
-- ---------------------------------------------------------

create policy "oportunidades_seguro_select_proprio_ou_gestao"
  on public.oportunidades_seguro for select
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

create policy "oportunidades_seguro_update_proprio_ou_gestao"
  on public.oportunidades_seguro for update
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

-- ---------------------------------------------------------
-- REVISOES — ligadas à venda, então seguem o vendedor da
-- venda original.
-- ---------------------------------------------------------

create policy "revisoes_select_proprio_ou_gestao"
  on public.revisoes for select
  using (
    exists (
      select 1 from public.vendas v
      where v.id = revisoes.venda_id
        and (
          v.vendedor_id = auth.uid()
          or (
            public.papel_atual() in ('gerente', 'auxiliar_administrativa')
            and v.unidade_id = public.unidade_atual()
          )
        )
    )
  );

-- ---------------------------------------------------------
-- ACOMPANHAMENTOS — visível para o responsável e para
-- gerente/auxiliar da unidade.
-- ---------------------------------------------------------

create policy "acompanhamentos_select_proprio_ou_gestao"
  on public.acompanhamentos for select
  using (
    responsavel_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

create policy "acompanhamentos_insert_proprio"
  on public.acompanhamentos for insert
  with check (
    responsavel_id = auth.uid()
    and unidade_id = public.unidade_atual()
  );

create policy "acompanhamentos_update_proprio_ou_gestao"
  on public.acompanhamentos for update
  using (
    responsavel_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

-- ---------------------------------------------------------
-- ATIVIDADES_DIARIAS — vendedor registra e vê as próprias;
-- gerente/auxiliar veem a unidade toda (CONTEXTO.md §8/§9).
-- ---------------------------------------------------------

create policy "atividades_diarias_select_proprio_ou_gestao"
  on public.atividades_diarias for select
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

create policy "atividades_diarias_insert_proprio"
  on public.atividades_diarias for insert
  with check (
    vendedor_id = auth.uid()
    and unidade_id = public.unidade_atual()
  );

create policy "atividades_diarias_update_proprio"
  on public.atividades_diarias for update
  using (vendedor_id = auth.uid())
  with check (vendedor_id = auth.uid());
