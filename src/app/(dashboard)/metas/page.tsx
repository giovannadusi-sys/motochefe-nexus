import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MetaVendedor } from "./_components/meta-vendedor";
import { MetasEquipe } from "./_components/metas-equipe";
import { MetasSkeleton } from "./_components/metas-skeleton";

export const metadata = { title: "Metas — Motochefe Nexus" };

export default async function MetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel, unidade_id").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Metas</h1>
        <p className="text-sm text-muted-foreground">
          {perfil?.papel === "vendedor"
            ? "Sua meta do mês e o déficit acumulado, se houver."
            : "Progresso de meta de cada vendedor da unidade."}
        </p>
      </div>

      <Suspense fallback={<MetasSkeleton />}>
        {perfil?.papel === "vendedor" && user ? (
          <MetaVendedor vendedorId={user.id} unidadeId={perfil.unidade_id} />
        ) : perfil?.unidade_id ? (
          <MetasEquipe unidadeId={perfil.unidade_id} />
        ) : null}
      </Suspense>
    </div>
  );
}
