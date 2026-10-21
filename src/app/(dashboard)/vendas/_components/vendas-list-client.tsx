"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { VendaRow } from "./venda-row";
import type { VendaAtualizada } from "../form-state";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
}

interface ClienteOption {
  id: string;
  nome: string;
}

/**
 * Lista com estado local: excluir/editar atualizam a linha na hora
 * (sem F5). O Server Component pai remonta esta lista via `key` quando
 * o filtro de datas muda, então não há sincronização por useEffect.
 */
export function VendasListClient({
  vendasIniciais,
  clientes,
  clientesDisponiveis,
}: {
  vendasIniciais: VendaAtualizada[];
  clientes: Cliente[];
  clientesDisponiveis: ClienteOption[];
}) {
  const [vendas, setVendas] = React.useState(vendasIniciais);
  const clientePorId = React.useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);

  if (vendas.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nenhuma venda para mostrar"
        description="Registre uma venda ou ajuste o filtro de datas."
      />
    );
  }

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {vendas.map((venda) => (
        <VendaRow
          key={venda.id}
          venda={venda}
          cliente={clientePorId.get(venda.cliente_id)}
          clientesDisponiveis={clientesDisponiveis}
          onExcluida={(id) => setVendas((atual) => atual.filter((v) => v.id !== id))}
          onAtualizada={(nova) =>
            setVendas((atual) => atual.map((v) => (v.id === nova.id ? nova : v)))
          }
        />
      ))}
    </Card>
  );
}
