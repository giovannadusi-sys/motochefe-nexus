-- =========================================================
-- Motochefe Nexus — Edição de equipe pela gestão (Etapa 14)
-- =========================================================

-- Só existia policy de update do próprio perfil. Gerente/auxiliar
-- precisam poder editar nome/papel de qualquer perfil da unidade.
-- Exclusão de usuário (auth.users) continua exigindo a Admin API
-- (service_role), fora do escopo de RLS — ver equipe/actions.ts.
create policy "perfis_update_gestao"
  on public.perfis for update
  using (
    unidade_id = public.unidade_atual()
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  )
  with check (
    unidade_id = public.unidade_atual()
    and public.papel_atual() in ('gerente', 'auxiliar_administrativa')
  );
