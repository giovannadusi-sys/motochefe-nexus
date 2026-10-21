import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { VendedorResumoRow } from "./vendedor-resumo-row";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const META_LIGACOES = 50;
const META_MENSAL = 200000;

interface StatCard {
  label: string;
  value: string;
  helper: string;
  progress?: number;
  tone?: "primary" | "success" | "danger";
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

/**
 * Server Component assíncrono com dados reais — substitui o widget
 * placeholder da Etapa 1, que nunca tinha sido conectado ao banco.
 */
export async function StatsWidget() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, unidade_id")
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = primeiroDiaDoMes();
  const { data: ranking } = await supabase.rpc("ranking_mensal_unidade");

  if (perfil.papel === "vendedor") {
    const { data: atividadeHoje } = await supabase
      .from("atividades_diarias")
      .select("ligacoes_realizadas, leads_recebidos")
      .eq("vendedor_id", user.id)
      .eq("data", hoje)
      .maybeSingle();

    const { data: vendasMes } = await supabase
      .from("vendas")
      .select("valor")
      .eq("vendedor_id", user.id)
      .gte("data_venda", inicioMes);

    const totalVendido = vendasMes?.reduce((soma, v) => soma + v.valor, 0) ?? 0;
    const minhaPosicao = ranking?.find((r) => r.vendedor_id === user.id)?.posicao;
    const ligacoes = atividadeHoje?.ligacoes_realizadas ?? 0;

    const stats: StatCard[] = [
      {
        label: "Leads hoje",
        value: String(atividadeHoje?.leads_recebidos ?? 0),
        helper: "Registrados por você hoje",
      },
      {
        label: "Ligações",
        value: `${ligacoes} / ${META_LIGACOES}`,
        helper: "Meta diária",
        progress: ligacoes / META_LIGACOES,
        tone: ligacoes >= META_LIGACOES ? "success" : "primary",
      },
      {
        label: "Vendas no mês",
        value: formatoMoeda.format(totalVendido),
        helper: `Meta: ${formatoMoeda.format(META_MENSAL)}`,
        progress: totalVendido / META_MENSAL,
      },
      {
        label: "Posição no ranking",
        value: minhaPosicao ? `${minhaPosicao}º` : "—",
        helper: "Unidade Piratininga, este mês",
      },
    ];

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} accent>
            <CardHeader>
              <CardTitle>{stat.label}</CardTitle>
            </CardHeader>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
            {typeof stat.progress === "number" && (
              <ProgressBar
                value={Math.min(1, stat.progress)}
                tone={stat.tone ?? "primary"}
                className="mt-3"
              />
            )}
          </Card>
        ))}
      </div>
    );
  }

  const { data: vendedores } = await supabase
    .from("perfis")
    .select("id, nome")
    .eq("unidade_id", perfil.unidade_id)
    .eq("papel", "vendedor")
    .order("nome");

  const { data: atividadesHoje } = await supabase
    .from("atividades_diarias")
    .select(
      "vendedor_id, ligacoes_realizadas, ligacoes_atendidas, leads_recebidos, videos_produzidos, quantidade_vendas, valor_vendas, seguros_fechados"
    )
    .eq("unidade_id", perfil.unidade_id)
    .eq("data", hoje);

  const { data: vendasMes } = await supabase
    .from("vendas")
    .select("valor, data_venda")
    .eq("unidade_id", perfil.unidade_id)
    .gte("data_venda", inicioMes);

  const totalVendidoUnidade = vendasMes?.reduce((soma, v) => soma + v.valor, 0) ?? 0;
  const vendasHoje = vendasMes?.filter((v) => v.data_venda === hoje) ?? [];
  const totalVendidoHoje = vendasHoje.reduce((soma, v) => soma + v.valor, 0);
  const lider = ranking && ranking.length > 0 ? ranking[0] : null;

  const atividadePorVendedor = new Map(atividadesHoje?.map((a) => [a.vendedor_id, a]));

  const resumoCards: StatCard[] = [
    {
      label: "Vendas no mês",
      value: formatoMoeda.format(totalVendidoUnidade),
      helper: "Total da unidade",
    },
    {
      label: "Vendas hoje",
      value: formatoMoeda.format(totalVendidoHoje),
      helper: `${vendasHoje.length} venda(s) hoje`,
    },
    {
      label: "Líder do mês",
      value: lider?.vendedor_nome ?? "—",
      helper: lider ? formatoMoeda.format(lider.total_vendido) : "Sem vendas este mês",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resumoCards.map((stat) => (
          <Card key={stat.label} accent>
            <CardHeader>
              <CardTitle>{stat.label}</CardTitle>
            </CardHeader>
            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
          </Card>
        ))}
      </div>

      <Card accent className="divide-y divide-[var(--border-soft)] p-0">
        <CardHeader className="px-5 pt-5">
          <CardTitle>Atividades de hoje — por vendedor (clique para detalhar)</CardTitle>
        </CardHeader>
        {!vendedores || vendedores.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum vendedor cadastrado.</p>
        ) : (
          vendedores.map((v) => {
            const a = atividadePorVendedor.get(v.id);
            return (
              <VendedorResumoRow
                key={v.id}
                nome={v.nome}
                ligacoesRealizadas={a?.ligacoes_realizadas ?? 0}
                ligacoesAtendidas={a?.ligacoes_atendidas ?? 0}
                leads={a?.leads_recebidos ?? 0}
                videos={a?.videos_produzidos ?? 0}
                quantidadeVendas={a?.quantidade_vendas ?? 0}
                valorVendas={a?.valor_vendas ?? 0}
                seguros={a?.seguros_fechados ?? 0}
              />
            );
          })
        )}
      </Card>
    </div>
  );
}
