-- =========================================================
-- Motochefe Nexus — Ranking seguro + DELETE de acompanhamentos (Etapa 10)
-- =========================================================

-- ---------------------------------------------------------
-- RANKING: função SECURITY DEFINER, não a view direto
--
-- A view `ranking_mensal` (Etapa 6) usa security_invoker=true de
-- propósito, para respeitar RLS. Mas isso quebra a regra confirmada
-- em CONTEXTO.md §6.1: ranking é uma exceção onde o vendedor PODE ver
-- o agregado da equipe, mesmo sem poder ver as vendas individuais dos
-- colegas. Se um vendedor consultasse a view diretamente, a RLS de
-- `vendas` faria os outros vendedores sumirem do agregado (não
-- aparecerem restritos — sumirem, como se não tivessem vendido nada).
--
-- Esta função roda como o dono da tabela (exímio de RLS por padrão em
-- Postgres), agrega TODAS as vendas da unidade do usuário, mas só
-- devolve nome + total + posição — nunca uma linha de venda individual
-- de outra pessoa. O recorte por unidade continua vindo de
-- unidade_atual(), então não vaza dado entre unidades diferentes.
-- ---------------------------------------------------------

create or replace function public.ranking_mensal_unidade()
returns table (
  vendedor_id uuid,
  vendedor_nome text,
  total_vendido numeric,
  quantidade_vendas bigint,
  posicao bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.vendedor_id,
    p.nome as vendedor_nome,
    sum(v.valor) as total_vendido,
    count(*) as quantidade_vendas,
    rank() over (order by sum(v.valor) desc) as posicao
  from public.vendas v
  join public.perfis p on p.id = v.vendedor_id
  where v.unidade_id = public.unidade_atual()
    and date_trunc('month', v.data_venda) = date_trunc('month', current_date)
  group by v.vendedor_id, p.nome;
$$;

revoke all on function public.ranking_mensal_unidade() from public;
grant execute on function public.ranking_mensal_unidade() to authenticated;

-- ---------------------------------------------------------
-- ACOMPANHAMENTOS: faltava policy de DELETE (só tínhamos
-- select/insert/update desde a Etapa 6) — sem ela, ninguém consegue
-- excluir um acompanhamento pelo client normal.
-- ---------------------------------------------------------

create policy "acompanhamentos_delete_proprio_ou_gestao"
  on public.acompanhamentos for delete
  using (
    responsavel_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );
