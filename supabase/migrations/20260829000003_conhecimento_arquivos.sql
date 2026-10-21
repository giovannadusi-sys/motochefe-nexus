-- =========================================================
-- Motochefe Nexus — PDF e links na Base de Conhecimento (Etapa 15)
-- =========================================================

alter table public.artigos_conhecimento add column arquivo_url text;
alter table public.artigos_conhecimento add column link_externo text;

-- Bucket público (leitura livre via URL, sem precisar de RLS para
-- visualizar o PDF depois de publicado) — mas upload/exclusão exigem
-- permissão de gestão, via policies em storage.objects abaixo.
insert into storage.buckets (id, name, public)
values ('base-conhecimento', 'base-conhecimento', true)
on conflict (id) do nothing;

create policy "base_conhecimento_upload_gestao"
  on storage.objects for insert
  with check (
    bucket_id = 'base-conhecimento'
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );

create policy "base_conhecimento_delete_gestao"
  on storage.objects for delete
  using (
    bucket_id = 'base-conhecimento'
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );

create policy "base_conhecimento_select_autenticado"
  on storage.objects for select
  using (bucket_id = 'base-conhecimento');
