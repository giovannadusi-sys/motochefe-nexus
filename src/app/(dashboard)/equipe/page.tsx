import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { ConvidarUsuarioButton } from "./_components/convidar-usuario-button";
import { EquipeList } from "./_components/equipe-list";
import { EquipeListSkeleton } from "./_components/equipe-list-skeleton";

export const metadata = { title: "Equipe — Motochefe Nexus" };

export default async function EquipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel").eq("id", user.id).single()
    : { data: null };

  // Defesa em profundidade: o item já some do menu para quem não é
  // gerente/auxiliar (config/nav.ts), mas alguém pode digitar a URL
  // direto. RLS também bloquearia a listagem, mas aqui evitamos
  // renderizar o botão de convite para quem não deveria nem vê-lo.
  const podeGerenciarEquipe =
    perfil?.papel === "gerente" || perfil?.papel === "auxiliar_administrativa";

  if (!podeGerenciarEquipe) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acesso restrito"
        description="Esta área é visível apenas para gerentes e auxiliares administrativas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Vendedores, gerentes e auxiliares da unidade.
          </p>
        </div>
        <ConvidarUsuarioButton />
      </div>

      <Suspense fallback={<EquipeListSkeleton />}>
        <EquipeList />
      </Suspense>
    </div>
  );
}
