import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { EquipeRowActions } from "./equipe-row-actions";
import type { PapelUsuario } from "@/types/database";

const PAPEL_LABEL: Record<PapelUsuario, string> = {
  vendedor: "Vendedor",
  gerente: "Gerente",
  auxiliar_administrativa: "Auxiliar administrativa",
};

const PAPEL_TONE: Record<PapelUsuario, "primary" | "success" | "neutral"> = {
  vendedor: "neutral",
  gerente: "primary",
  auxiliar_administrativa: "success",
};

/**
 * Server Component assíncrono — lista os perfis da própria unidade.
 * RLS já garante que só gerente/auxiliar administrativa chegam a ver
 * mais de um perfil (ver migration 20260824000004_perfis_gestao.sql).
 */
export async function EquipeList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfis, error } = await supabase
    .from("perfis")
    .select("id, nome, papel")
    .order("nome");

  if (error) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Não foi possível carregar a equipe"
        description="Tente recarregar a página."
      />
    );
  }

  if (!perfis || perfis.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Nenhum membro encontrado"
        description="Use o botão “Convidar usuário” acima para adicionar alguém à equipe."
      />
    );
  }

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {perfis.map((perfil) => (
        <div key={perfil.id} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{perfil.nome}</p>
            <Badge tone={PAPEL_TONE[perfil.papel]}>{PAPEL_LABEL[perfil.papel]}</Badge>
          </div>
          <EquipeRowActions usuario={perfil} ehVoceMesmo={perfil.id === user?.id} />
        </div>
      ))}
    </Card>
  );
}
