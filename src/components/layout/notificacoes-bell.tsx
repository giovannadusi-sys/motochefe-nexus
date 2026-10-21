import { createClient } from "@/lib/supabase/server";
import { NotificacoesDropdown, type NotificacaoItem } from "./notificacoes-dropdown";

/**
 * Busca revisões pendentes com data prevista nos próximos 15 dias (ou
 * já vencidas). RLS já recorta certo: vendedor vê as revisões das
 * próprias vendas; gerente/auxiliar veem as da unidade toda — não
 * precisa filtro extra aqui.
 */
export async function NotificacoesBell() {
  const supabase = await createClient();

  const limite = new Date();
  limite.setDate(limite.getDate() + 15);
  const limiteStr = limite.toISOString().slice(0, 10);

  const { data: revisoes } = await supabase
    .from("revisoes")
    .select("id, data_prevista, cliente_id")
    .eq("status", "pendente")
    .lte("data_prevista", limiteStr)
    .order("data_prevista", { ascending: true })
    .limit(10);

  let itens: NotificacaoItem[] = [];

  if (revisoes && revisoes.length > 0) {
    const clienteIds = [...new Set(revisoes.map((r) => r.cliente_id))];
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nome")
      .in("id", clienteIds);
    const nomePorId = new Map(clientes?.map((c) => [c.id, c.nome]));

    const hoje = new Date();
    itens = revisoes.map((r) => {
      const prevista = new Date(`${r.data_prevista}T12:00:00`);
      const diasRestantes = Math.ceil((prevista.getTime() - hoje.getTime()) / 86_400_000);
      return {
        id: r.id,
        clienteNome: nomePorId.get(r.cliente_id) ?? "Cliente removido",
        dataPrevista: r.data_prevista,
        diasRestantes,
      };
    });
  }

  return <NotificacoesDropdown itens={itens} />;
}
