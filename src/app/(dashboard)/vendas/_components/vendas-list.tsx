import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/shared/empty-state";
import { VendasListClient } from "./vendas-list-client";

interface ClienteOption {
  id: string;
  nome: string;
}

/**
 * Server Component assíncrono — vendas da unidade (RLS decide o
 * recorte), com filtro opcional por período (data_venda).
 */
export async function VendasList({
  clientesDisponiveis,
  dataDe,
  dataAte,
}: {
  clientesDisponiveis: ClienteOption[];
  dataDe?: string;
  dataAte?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("vendas")
    .select(
      "id, cliente_id, data_venda, modelo_moto, cor, valor, forma_pagamento, detalhe_pagamento, seguro_contratado, chassi, origem_cliente, teve_brinde, teve_frete, observacoes, acessorios, valor_acessorios"
    )
    .order("data_venda", { ascending: false });
  if (dataDe) query = query.gte("data_venda", dataDe);
  if (dataAte) query = query.lte("data_venda", dataAte);

  const { data: vendas, error } = await query;

  if (error) {
    console.error("[vendas/VendasList] erro do Supabase:", error);
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Não foi possível carregar as vendas"
        description="Tente recarregar a página."
      />
    );
  }

  const clienteIds = [...new Set((vendas ?? []).map((v) => v.cliente_id))];
  const { data: clientes } = clienteIds.length
    ? await supabase.from("clientes").select("id, nome, telefone, email, cpf").in("id", clienteIds)
    : { data: [] };

  return (
    <VendasListClient
      key={`${dataDe ?? ""}-${dataAte ?? ""}`}
      vendasIniciais={vendas ?? []}
      clientes={clientes ?? []}
      clientesDisponiveis={clientesDisponiveis}
    />
  );
}
