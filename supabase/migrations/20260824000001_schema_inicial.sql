-- =========================================================
-- Motochefe Nexus — Schema inicial (Etapa 6)
--
-- Baseado em docs/CONTEXTO.md e docs/BUSINESS_RULES.md.
-- Campos ligados a regras marcadas como [A VALIDAR] no
-- BUSINESS_RULES.md foram deixados flexíveis de propósito
-- (enum simples, sem lógica de transição de estado ainda).
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------

create type public.papel_usuario as enum ('vendedor', 'gerente', 'auxiliar_administrativa');

create type public.forma_pagamento as enum ('avista', 'financiado', 'consorcio', 'outro');

create type public.status_oportunidade_seguro as enum ('aberta', 'convertida', 'expirada');

create type public.status_revisao as enum ('pendente', 'concluida');

create type public.tipo_acompanhamento as enum ('follow_up', 'retorno', 'seguro', 'revisao', 'pos_venda', 'outro');

create type public.status_acompanhamento as enum ('pendente', 'concluido', 'cancelado');

-- ---------------------------------------------------------
-- UNIDADES
-- Preparado para multi-empresa/multi-unidade (CONTEXTO.md §5),
-- mesmo que o MVP rode só com Motochefe/Piratininga.
-- ---------------------------------------------------------

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  empresa_nome text not null default 'Motochefe',
  nome text not null,
  created_at timestamptz not null default now()
);

comment on table public.unidades is 'Unidade comercial (ex: Piratininga). Preparada para expansão multi-unidade/multi-empresa.';

-- ---------------------------------------------------------
-- PERFIS
-- Estende auth.users do Supabase. Não duplica autenticação —
-- só guarda o que é específico do domínio (papel, unidade).
-- ---------------------------------------------------------

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  papel public.papel_usuario not null,
  nome text not null,
  created_at timestamptz not null default now()
);

comment on table public.perfis is 'Dados de domínio do usuário autenticado: papel (vendedor/gerente/auxiliar) e unidade.';

create index perfis_unidade_id_idx on public.perfis (unidade_id);

-- ---------------------------------------------------------
-- CLIENTES
-- CRM próprio da unidade (CONTEXTO.md §10). Dados da moto NÃO
-- ficam aqui — pertencem à venda. Um cliente pode ter várias
-- vendas ao longo do tempo.
-- ---------------------------------------------------------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  nome text not null,
  cpf text,
  telefone text,
  data_nascimento date,
  email text,
  endereco text,
  cep text,
  bairro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clientes is 'Cadastro de clientes da unidade. Modelo/cor da moto ficam em vendas, não aqui.';

-- CPF é o identificador nacional mais confiável para evitar
-- duplicidade — restrição técnica, não depende da regra de
-- negócio de qual campo "prevalece" (ainda [A VALIDAR]).
-- Único por unidade e só quando preenchido.
create unique index clientes_unidade_cpf_key
  on public.clientes (unidade_id, cpf)
  where cpf is not null;

create index clientes_unidade_id_idx on public.clientes (unidade_id);
create index clientes_telefone_idx on public.clientes (telefone);

-- ---------------------------------------------------------
-- VENDAS
-- Substitui gradualmente as planilhas individuais e a planilha
-- geral (CONTEXTO.md §11). Alimenta faturamento, ranking,
-- metas, seguro e revisão.
-- ---------------------------------------------------------

create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  vendedor_id uuid not null references public.perfis (id) on delete restrict,
  data_venda date not null default current_date,
  modelo_moto text not null,
  cor text,
  valor numeric(12, 2) not null check (valor > 0),
  forma_pagamento public.forma_pagamento not null default 'outro',
  seguro_contratado boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.vendas is 'Cada venda registrada. Fonte de verdade para faturamento, ranking e metas.';

create index vendas_unidade_id_idx on public.vendas (unidade_id);
create index vendas_cliente_id_idx on public.vendas (cliente_id);
create index vendas_vendedor_id_idx on public.vendas (vendedor_id);
create index vendas_data_venda_idx on public.vendas (data_venda);

-- ---------------------------------------------------------
-- METAS_MENSAIS
-- Meta mínima R$200.000 (BUSINESS_RULES.md §1.1). O valor
-- vendido no mês é CALCULADO por agregação de vendas — não é
-- duplicado aqui. O que precisa ser guardado é o déficit
-- acumulado, porque é estado que atravessa meses.
-- ---------------------------------------------------------

create table public.metas_mensais (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.perfis (id) on delete restrict,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  mes_referencia date not null, -- sempre o dia 1 do mês (ex: 2026-08-01)
  meta_valor numeric(12, 2) not null default 200000.00 check (meta_valor >= 0),
  deficit_anterior numeric(12, 2) not null default 0 check (deficit_anterior >= 0),
  created_at timestamptz not null default now(),
  unique (vendedor_id, mes_referencia)
);

comment on table public.metas_mensais is 'Meta e déficit acumulado por vendedor/mês. Vendido é calculado via view sobre vendas.';

create index metas_mensais_unidade_id_idx on public.metas_mensais (unidade_id);

-- ---------------------------------------------------------
-- OPORTUNIDADES_SEGURO
-- Regra confirmada (BUSINESS_RULES.md §2.2): criada quando o
-- cliente não fecha o seguro na hora da venda. Janela de
-- conversão: 120 dias. O que acontece após expirar ainda é
-- [A VALIDAR] — por isso o status fica simples, sem mais
-- transições automáticas implementadas aqui.
-- ---------------------------------------------------------

create table public.oportunidades_seguro (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  venda_id uuid not null unique references public.vendas (id) on delete cascade,
  vendedor_id uuid not null references public.perfis (id) on delete restrict,
  data_criacao date not null default current_date,
  data_limite date generated always as (data_criacao + 120) stored,
  status public.status_oportunidade_seguro not null default 'aberta',
  data_conversao date,
  created_at timestamptz not null default now()
);

comment on table public.oportunidades_seguro is 'Uma por venda (no máximo). Janela de conversão de 120 dias a partir da criação.';

create index oportunidades_seguro_unidade_id_idx on public.oportunidades_seguro (unidade_id);
create index oportunidades_seguro_cliente_id_idx on public.oportunidades_seguro (cliente_id);
create index oportunidades_seguro_vendedor_id_idx on public.oportunidades_seguro (vendedor_id);
create index oportunidades_seguro_status_idx on public.oportunidades_seguro (status);

-- ---------------------------------------------------------
-- REVISOES
-- Regra confirmada (BUSINESS_RULES.md §3.1): a cada 3 meses OU
-- 2.000km, o que ocorrer primeiro. Como não há telemetria, o
-- gatilho confiável no MVP é o tempo; km fica como registro
-- manual complementar. Quantidade total de revisões é
-- [A VALIDAR] — por isso não há limite/contador aqui.
-- ---------------------------------------------------------

create table public.revisoes (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  venda_id uuid not null references public.vendas (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  data_prevista date not null,
  km_previsto integer not null default 2000 check (km_previsto > 0),
  status public.status_revisao not null default 'pendente',
  data_conclusao date,
  km_registrado integer check (km_registrado >= 0),
  created_at timestamptz not null default now()
);

comment on table public.revisoes is 'Ciclo de revisão por venda. Uma venda pode ter várias ao longo do tempo.';

create index revisoes_unidade_id_idx on public.revisoes (unidade_id);
create index revisoes_venda_id_idx on public.revisoes (venda_id);
create index revisoes_status_idx on public.revisoes (status);
create index revisoes_data_prevista_idx on public.revisoes (data_prevista);

-- ---------------------------------------------------------
-- ACOMPANHAMENTOS
-- Tipos e campos conforme CONTEXTO.md §14. Aparecem no
-- dashboard/agenda como pendências.
-- ---------------------------------------------------------

create table public.acompanhamentos (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  responsavel_id uuid not null references public.perfis (id) on delete restrict,
  tipo public.tipo_acompanhamento not null,
  descricao text,
  data date not null default current_date,
  status public.status_acompanhamento not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.acompanhamentos is 'Follow-up, retorno, seguro, revisão, pós-venda ou outro — pendências ligadas a um cliente.';

create index acompanhamentos_unidade_id_idx on public.acompanhamentos (unidade_id);
create index acompanhamentos_cliente_id_idx on public.acompanhamentos (cliente_id);
create index acompanhamentos_responsavel_id_idx on public.acompanhamentos (responsavel_id);
create index acompanhamentos_status_data_idx on public.acompanhamentos (status, data);

-- ---------------------------------------------------------
-- ATIVIDADES_DIARIAS
-- Meta de 50 ligações/dia confirmada (CONTEXTO.md §9). Meta de
-- vídeos ainda não definida — coluna existe, sem meta associada.
-- ---------------------------------------------------------

create table public.atividades_diarias (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references public.perfis (id) on delete restrict,
  unidade_id uuid not null references public.unidades (id) on delete restrict,
  data date not null default current_date,
  ligacoes_realizadas integer not null default 0 check (ligacoes_realizadas >= 0),
  videos_produzidos integer not null default 0 check (videos_produzidos >= 0),
  leads_recebidos integer not null default 0 check (leads_recebidos >= 0),
  created_at timestamptz not null default now(),
  unique (vendedor_id, data)
);

comment on table public.atividades_diarias is 'Um registro por vendedor por dia. Período considerado: 00h–19h (CONTEXTO.md §8).';

create index atividades_diarias_unidade_id_idx on public.atividades_diarias (unidade_id);

-- ---------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clientes_set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger acompanhamentos_set_updated_at
  before update on public.acompanhamentos
  for each row execute function public.set_updated_at();
