-- Seed de desenvolvimento — dados mínimos para começar a testar
-- o app localmente. Não roda em produção automaticamente; é
-- aplicado via `supabase db reset` ou `supabase seed` local.

insert into public.unidades (empresa_nome, nome)
values ('Motochefe', 'Piratininga')
on conflict do nothing;
