-- =========================================================
-- Motochefe Nexus — Gestão de equipe (Etapa 7)
--
-- Decisão confirmada: gerente E auxiliar administrativa podem
-- ver/criar usuários da equipe. A policy original de perfis só
-- previa gerente — estende para incluir auxiliar_administrativa,
-- em linha com o que já vale para vendas/metas/acompanhamentos.
-- =========================================================

drop policy "perfis_select_proprio_ou_gerente" on public.perfis;

create policy "perfis_select_proprio_ou_gestao"
  on public.perfis for select
  using (
    id = auth.uid()
    or (
      public.papel_atual() in ('gerente', 'auxiliar_administrativa')
      and unidade_id = public.unidade_atual()
    )
  );

-- Nota: a CRIAÇÃO de perfis (e do usuário em auth.users por trás dele)
-- não tem policy de INSERT aqui de propósito. Um perfil só existe
-- depois que o usuário existe em auth.users, e isso exige a Admin API
-- do Supabase (service_role) — uma operação privilegiada que roda
-- inteiramente numa Server Action (src/app/(dashboard)/equipe/actions.ts),
-- nunca pelo client anon/authenticated. O controle de "quem pode
-- convidar" acontece no código da action (checa papel_atual antes de
-- chamar a Admin API), não em RLS.
