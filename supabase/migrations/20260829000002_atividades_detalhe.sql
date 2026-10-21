-- =========================================================
-- Motochefe Nexus — Detalhamento de atividades diárias (Etapa 15)
-- =========================================================

alter table public.atividades_diarias add column ligacoes_atendidas integer not null default 0 check (ligacoes_atendidas >= 0);
alter table public.atividades_diarias add column quantidade_vendas integer not null default 0 check (quantidade_vendas >= 0);
alter table public.atividades_diarias add column valor_vendas numeric(12, 2) not null default 0 check (valor_vendas >= 0);
alter table public.atividades_diarias add column seguros_fechados integer not null default 0 check (seguros_fechados >= 0);

comment on column public.atividades_diarias.ligacoes_atendidas is 'Quantas das ligacoes_realizadas foram atendidas (o restante = não atendidas, calculado na UI).';
