-- =========================================================
-- Motochefe Nexus — Views de leitura (Etapa 6)
--
-- Ranking e progresso de metas não são tabelas — são
-- derivados de vendas + metas_mensais, para não duplicar a
-- fonte de verdade.
-- =========================================================

-- ---------------------------------------------------------
-- RANKING_MENSAL
-- Regra confirmada (CONTEXTO.md §13): valor total vendido,
-- por vendedor, dentro da própria unidade.
-- ---------------------------------------------------------

create view public.ranking_mensal
with (security_invoker = true)
as
select
  v.unidade_id,
  v.vendedor_id,
  p.nome as vendedor_nome,
  date_trunc('month', v.data_venda)::date as mes_referencia,
  sum(v.valor) as total_vendido,
  count(*) as quantidade_vendas,
  rank() over (
    partition by v.unidade_id, date_trunc('month', v.data_venda)
    order by sum(v.valor) desc
  ) as posicao
from public.vendas v
join public.perfis p on p.id = v.vendedor_id
group by v.unidade_id, v.vendedor_id, p.nome, date_trunc('month', v.data_venda);

comment on view public.ranking_mensal is 'Ranking por unidade/mês, baseado no valor total vendido (CONTEXTO.md §13).';

-- ---------------------------------------------------------
-- METAS_PROGRESSO
-- Aplica a regra de déficit/comissão já confirmada
-- (BUSINESS_RULES.md §1.2): comissão só libera quando
-- vendido >= meta do mês + déficit acumulado do mês anterior.
-- ---------------------------------------------------------

create view public.metas_progresso
with (security_invoker = true)
as
select
  m.id as meta_id,
  m.vendedor_id,
  m.unidade_id,
  m.mes_referencia,
  m.meta_valor,
  m.deficit_anterior,
  coalesce(v.total_vendido, 0) as total_vendido,
  greatest(m.meta_valor + m.deficit_anterior - coalesce(v.total_vendido, 0), 0) as saldo_faltante,
  (coalesce(v.total_vendido, 0) >= m.meta_valor + m.deficit_anterior) as comissao_liberada
from public.metas_mensais m
left join (
  select
    unidade_id,
    vendedor_id,
    date_trunc('month', data_venda)::date as mes_referencia,
    sum(valor) as total_vendido
  from public.vendas
  group by unidade_id, vendedor_id, date_trunc('month', data_venda)
) v
  on v.vendedor_id = m.vendedor_id
  and v.unidade_id = m.unidade_id
  and v.mes_referencia = m.mes_referencia;

comment on view public.metas_progresso is 'Progresso de meta por vendedor/mês, já aplicando a regra de déficit + liberação de comissão.';
