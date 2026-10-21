import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AtividadeForm } from "./_components/atividade-form";
import { AtividadesEquipe } from "./_components/atividades-equipe";
import { AtividadesSkeleton } from "./_components/atividades-skeleton";

export const metadata = { title: "Atividades — Motochefe Nexus" };

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel, unidade_id").eq("id", user.id).single()
    : { data: null };

  const hoje = new Date().toISOString().slice(0, 10);
  const params = await searchParams;
  const dataFiltro = params.data && /^\d{4}-\d{2}-\d{2}$/.test(params.data) ? params.data : hoje;

  let conteudo: React.ReactNode = null;
  const ehGestao = perfil?.papel === "gerente" || perfil?.papel === "auxiliar_administrativa";

  if (perfil?.papel === "vendedor" && user) {
    const { data: atividadeHoje } = await supabase
      .from("atividades_diarias")
      .select(
        "ligacoes_realizadas, ligacoes_atendidas, videos_produzidos, leads_recebidos, quantidade_vendas, valor_vendas, seguros_fechados"
      )
      .eq("vendedor_id", user.id)
      .eq("data", hoje)
      .maybeSingle();

    conteudo = (
      <AtividadeForm
        registroInicial={{
          ligacoes_realizadas: atividadeHoje?.ligacoes_realizadas ?? 0,
          ligacoes_atendidas: atividadeHoje?.ligacoes_atendidas ?? 0,
          videos_produzidos: atividadeHoje?.videos_produzidos ?? 0,
          leads_recebidos: atividadeHoje?.leads_recebidos ?? 0,
          quantidade_vendas: atividadeHoje?.quantidade_vendas ?? 0,
          valor_vendas: atividadeHoje?.valor_vendas ?? 0,
          seguros_fechados: atividadeHoje?.seguros_fechados ?? 0,
        }}
      />
    );
  } else if (ehGestao && perfil?.unidade_id) {
    conteudo = <AtividadesEquipe unidadeId={perfil.unidade_id} data={dataFiltro} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Atividades diárias</h1>
          <p className="text-sm text-muted-foreground">
            Ligações (meta de 50/dia), vídeos e leads recebidos.
          </p>
        </div>

        {ehGestao && (
          <form className="flex items-end gap-2" method="GET">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data</label>
              <Input name="data" type="date" defaultValue={dataFiltro} max={hoje} />
            </div>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        )}
      </div>

      <Suspense fallback={<AtividadesSkeleton />}>{conteudo}</Suspense>
    </div>
  );
}
