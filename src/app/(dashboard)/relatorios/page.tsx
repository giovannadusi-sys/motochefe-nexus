import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CopiarResumoButton } from "./_components/copiar-resumo-button";

export const metadata = { title: "Relatórios — Motochefe Nexus" };

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoDataLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function hojeStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dataValidaOu(valor: string | undefined, padrao: string): string {
  return valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : padrao;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const params = await searchParams;
  const hoje = hojeStr();
  const de = dataValidaOu(params.de, hoje);
  const ate = dataValidaOu(params.ate, hoje);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel, unidade_id").eq("id", user.id).single()
    : { data: null };

  if (!perfil || !user) {
    return null;
  }

  const ehGestao = perfil.papel === "gerente" || perfil.papel === "auxiliar_administrativa";

  let atividadesQuery = supabase
    .from("atividades_diarias")
    .select("vendedor_id, ligacoes_realizadas, ligacoes_atendidas, videos_produzidos, leads_recebidos")
    .gte("data", de)
    .lte("data", ate);
  if (!ehGestao) atividadesQuery = atividadesQuery.eq("vendedor_id", user.id);
  const { data: atividades } = await atividadesQuery;

  let vendasQuery = supabase
    .from("vendas")
    .select("vendedor_id, valor, valor_acessorios, acessorios")
    .gte("data_venda", de)
    .lte("data_venda", ate);
  if (!ehGestao) vendasQuery = vendasQuery.eq("vendedor_id", user.id);
  const { data: vendas } = await vendasQuery;

  const totalLigacoes = atividades?.reduce((s, a) => s + a.ligacoes_realizadas, 0) ?? 0;
  const totalLigacoesAtendidas = atividades?.reduce((s, a) => s + a.ligacoes_atendidas, 0) ?? 0;
  const totalLigacoesNaoAtendidas = Math.max(0, totalLigacoes - totalLigacoesAtendidas);
  const totalVideos = atividades?.reduce((s, a) => s + a.videos_produzidos, 0) ?? 0;
  const totalLeads = atividades?.reduce((s, a) => s + a.leads_recebidos, 0) ?? 0;
  const totalVendasQtd = vendas?.length ?? 0;
  // Valor dos veículos e dos acessórios ficam SEMPRE separados.
  const totalVendasValor = vendas?.reduce((s, v) => s + v.valor, 0) ?? 0;
  const totalAcessoriosValor = vendas?.reduce((s, v) => s + v.valor_acessorios, 0) ?? 0;
  const totalAcessoriosQtd = vendas?.reduce((s, v) => s + v.acessorios.length, 0) ?? 0;

  interface LinhaEquipe {
    nome: string;
    ligacoes: number;
    ligacoesAtendidas: number;
    ligacoesNaoAtendidas: number;
    videos: number;
    leads: number;
    vendasQtd: number;
    vendasValor: number;
    acessoriosValor: number;
  }
  let breakdown: LinhaEquipe[] = [];

  if (ehGestao) {
    const { data: vendedores } = await supabase
      .from("perfis")
      .select("id, nome")
      .eq("unidade_id", perfil.unidade_id)
      .eq("papel", "vendedor")
      .order("nome");

    breakdown = (vendedores ?? []).map((v) => {
      const ativ = atividades?.filter((a) => a.vendedor_id === v.id) ?? [];
      const vend = vendas?.filter((x) => x.vendedor_id === v.id) ?? [];
      const ligacoesVendedor = ativ.reduce((s, a) => s + a.ligacoes_realizadas, 0);
      const atendidasVendedor = ativ.reduce((s, a) => s + a.ligacoes_atendidas, 0);
      return {
        nome: v.nome,
        ligacoes: ligacoesVendedor,
        ligacoesAtendidas: atendidasVendedor,
        ligacoesNaoAtendidas: Math.max(0, ligacoesVendedor - atendidasVendedor),
        videos: ativ.reduce((s, a) => s + a.videos_produzidos, 0),
        leads: ativ.reduce((s, a) => s + a.leads_recebidos, 0),
        vendasQtd: vend.length,
        vendasValor: vend.reduce((s, x) => s + x.valor, 0),
        acessoriosValor: vend.reduce((s, x) => s + x.valor_acessorios, 0),
      };
    });
  }

  const periodoLabel =
    de === ate
      ? formatoDataLabel.format(new Date(`${de}T12:00:00`))
      : `${formatoDataLabel.format(new Date(`${de}T12:00:00`))} a ${formatoDataLabel.format(new Date(`${ate}T12:00:00`))}`;

  const linhasResumo = [
    `📊 Relatório Motochefe Piratininga — ${periodoLabel}`,
    `Ligações: ${totalLigacoes} (${totalLigacoesAtendidas} atendidas, ${totalLigacoesNaoAtendidas} não atendidas) | Leads: ${totalLeads} | Vídeos: ${totalVideos}`,
    `Vendas de veículos: ${totalVendasQtd} (${formatoMoeda.format(totalVendasValor)})`,
    `Acessórios (à parte): ${totalAcessoriosQtd} itens (${formatoMoeda.format(totalAcessoriosValor)})`,
  ];
  if (ehGestao && breakdown.length > 0) {
    linhasResumo.push("", "Por vendedor:");
    for (const b of breakdown) {
      linhasResumo.push(
        `- ${b.nome}: ${b.ligacoes} ligações (${b.ligacoesAtendidas} atendidas, ${b.ligacoesNaoAtendidas} não atendidas), ${b.leads} leads, ${b.vendasQtd} vendas (${formatoMoeda.format(b.vendasValor)}) + acessórios à parte ${formatoMoeda.format(b.acessoriosValor)}`
      );
    }
  }
  const resumoTexto = linhasResumo.join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            {ehGestao ? "Resumo da unidade por período." : "Seu resumo por período."}
          </p>
        </div>
        <CopiarResumoButton resumo={resumoTexto} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">De</label>
          <Input name="de" type="date" defaultValue={de} max={hoje} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Até</label>
          <Input name="ate" type="date" defaultValue={ate} max={hoje} />
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs text-muted-foreground">Ligações</p>
          <p className="text-2xl font-semibold text-foreground">{totalLigacoes}</p>
          <p className="text-xs text-muted-foreground">
            {totalLigacoesAtendidas} atendidas · {totalLigacoesNaoAtendidas} não atendidas
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Leads</p>
          <p className="text-2xl font-semibold text-foreground">{totalLeads}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Vídeos</p>
          <p className="text-2xl font-semibold text-foreground">{totalVideos}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Vendas (veículos)</p>
          <p className="text-2xl font-semibold text-foreground">{totalVendasQtd}</p>
          <p className="text-xs text-muted-foreground">{formatoMoeda.format(totalVendasValor)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Acessórios (à parte)</p>
          <p className="text-2xl font-semibold text-foreground">
            {formatoMoeda.format(totalAcessoriosValor)}
          </p>
          <p className="text-xs text-muted-foreground">{totalAcessoriosQtd} itens</p>
        </Card>
      </div>

      {ehGestao && (
        <Card className="divide-y divide-[var(--border-soft)] p-0">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Por vendedor</CardTitle>
          </CardHeader>
          {breakdown.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum vendedor cadastrado.</p>
          ) : (
            breakdown.map((b) => (
              <div key={b.nome} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-sm font-medium text-foreground">{b.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {b.ligacoes} ligações ({b.ligacoesAtendidas} atendidas, {b.ligacoesNaoAtendidas}{" "}
                  não atendidas) · {b.leads} leads · {b.vendasQtd} vendas (
                  {formatoMoeda.format(b.vendasValor)}) · acessórios à parte {formatoMoeda.format(b.acessoriosValor)}
                </p>
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}
