import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SupabaseNaoConfigurado } from "@/components/shared/supabase-nao-configurado";

/**
 * Proteção de rota real: sem sessão válida, não entra na área logada.
 * A renovação da sessão em si é feita pelo proxy.ts (Etapa 5) — aqui
 * só decidimos se deixa passar ou manda para /login.
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return <SupabaseNaoConfigurado />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, unidade_id, papel")
    .eq("id", user.id)
    .single();

  let unidadeNome = "—";
  if (perfil?.unidade_id) {
    const { data: unidade } = await supabase
      .from("unidades")
      .select("nome")
      .eq("id", perfil.unidade_id)
      .single();
    unidadeNome = unidade?.nome ?? "—";
  }

  return (
    <DashboardShell
      userName={perfil?.nome ?? user.email ?? undefined}
      unidadeNome={unidadeNome}
      papel={perfil?.papel}
    >
      {children}
    </DashboardShell>
  );
}
