-- Acessórios vendidos junto com a moto. Guardados à parte: o valor
-- NUNCA entra em vendas.valor (ranking, metas e dashboard seguem
-- somando apenas o veículo).
alter table public.vendas
  add column if not exists acessorios jsonb not null default '[]'::jsonb,
  add column if not exists valor_acessorios numeric(12,2) not null default 0
    check (valor_acessorios >= 0);