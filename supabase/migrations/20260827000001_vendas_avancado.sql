-- =========================================================
-- Motochefe Nexus — Vendas avançado (Etapa 13)
-- =========================================================

-- 1. Formas de pagamento simplificadas: à vista, parcelado, outro.
create type public.forma_pagamento_new as enum ('avista', 'parcelado', 'outro');

alter table public.vendas add column forma_pagamento_new public.forma_pagamento_new;

update public.vendas set forma_pagamento_new = case
  when forma_pagamento::text = 'avista' then 'avista'::public.forma_pagamento_new
  when forma_pagamento::text = 'financiado' then 'parcelado'::public.forma_pagamento_new
  when forma_pagamento::text = 'consorcio' then 'parcelado'::public.forma_pagamento_new
  else 'outro'::public.forma_pagamento_new
end;

alter table public.vendas alter column forma_pagamento_new set default 'outro'::public.forma_pagamento_new;
alter table public.vendas alter column forma_pagamento_new set not null;

alter table public.vendas drop column forma_pagamento;
alter table public.vendas rename column forma_pagamento_new to forma_pagamento;

drop type public.forma_pagamento;
alter type public.forma_pagamento_new rename to forma_pagamento;

-- 2. Novos campos da venda
alter table public.vendas add column chassi text;
alter table public.vendas add column origem_cliente text;
alter table public.vendas add column teve_brinde boolean not null default false;
alter table public.vendas add column teve_frete boolean not null default false;
alter table public.vendas add column observacoes text;

create unique index vendas_unidade_chassi_key
  on public.vendas (unidade_id, chassi)
  where chassi is not null;

-- 3. RLS: faltava UPDATE/DELETE em vendas (só havia select/insert)
create policy "vendas_update_proprio_ou_gestao"
  on public.vendas for update
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

create policy "vendas_delete_proprio_ou_gestao"
  on public.vendas for delete
  using (
    vendedor_id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );
