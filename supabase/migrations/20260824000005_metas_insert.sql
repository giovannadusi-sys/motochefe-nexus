-- =========================================================
-- Motochefe Nexus — Provisionamento de metas mensais (Etapa 9)
--
-- A tabela metas_mensais tinha só policy de SELECT (Etapa 6) —
-- ninguém conseguia criar o registro do mês pelo client normal.
-- Precisa existir uma linha por vendedor/mês para a view
-- metas_progresso funcionar; essa criação acontece sob demanda
-- (ver app/(dashboard)/metas/data.ts), então precisa de INSERT.
-- =========================================================

create policy "metas_mensais_insert_proprio_ou_gestao"
  on public.metas_mensais for insert
  with check (
    unidade_id = public.unidade_atual()
    and (
      vendedor_id = auth.uid()
      or public.papel_atual() in ('gerente', 'auxiliar_administrativa')
    )
  );
