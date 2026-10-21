import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { NovoArtigoButton } from "./_components/novo-artigo-button";
import { ArtigosList } from "./_components/artigos-list";
import { ArtigosListSkeleton } from "./_components/artigos-list-skeleton";

export const metadata = { title: "Base de Conhecimento — Motochefe Nexus" };

export default async function ConhecimentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel").eq("id", user.id).single()
    : { data: null };

  const podeEditar = perfil?.papel === "gerente" || perfil?.papel === "auxiliar_administrativa";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Produtos, especificações, processos, garantia e treinamentos.
          </p>
        </div>

        {podeEditar && <NovoArtigoButton />}
      </div>

      <Suspense fallback={<ArtigosListSkeleton />}>
        <ArtigosList />
      </Suspense>
    </div>
  );
}
