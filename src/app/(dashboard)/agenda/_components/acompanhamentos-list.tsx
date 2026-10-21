import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { TipoAcompanhamento } from "@/types/database";
import { AcompanhamentoRowActions } from "./acompanhamento-row-actions";

interface ClienteOption {
  id: string;
  nome: string;
}

const TIPO_LABEL: Record<TipoAcompanhamento, string> = {
  follow_up: "Follow-up",
  retorno: "Retorno",
  seguro: "Seguro",
  revisao: "Revisão",
  pos_venda: "Pós-venda",
  outro: "Outro",
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

/**
 * Server Component assíncrono — pendentes primeiro (ordenados por
 * data), concluídos/cancelados depois. RLS decide o recorte: vendedor
 * vê os que é responsável; gerente/auxiliar veem todos da unidade.
 */
export async function AcompanhamentosList({ clientes }: { clientes: ClienteOption[] }) {
  const supabase = await createClient();
  const { data: acompanhamentos, error } = await supabase
    .from("acompanhamentos")
    .select("id, cliente_id, tipo, descricao, data, status")
    .order("status", { ascending: true })
    .order("data", { ascending: true });

  if (error) {
    console.error("[agenda/AcompanhamentosList] erro do Supabase:", error);
    return (
      <EmptyState
        icon={CalendarClock}
        title="Não foi possível carregar a agenda"
        description="Tente recarregar a página."
      />
    );
  }

  if (!acompanhamentos || acompanhamentos.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nenhum acompanhamento registrado"
        description="Use o botão “Novo acompanhamento” acima para agendar um follow-up, retorno ou revisão."
      />
    );
  }

  const clienteIds = [...new Set(acompanhamentos.map((a) => a.cliente_id))];
  const { data: clientesReferenciados } = await supabase
    .from("clientes")
    .select("id, nome")
    .in("id", clienteIds);
  const nomeDoCliente = new Map(clientesReferenciados?.map((c) => [c.id, c.nome]));

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {acompanhamentos.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={
                  item.status === "pendente"
                    ? "truncate text-sm font-medium text-foreground"
                    : "truncate text-sm font-medium text-muted-foreground line-through"
                }
              >
                {nomeDoCliente.get(item.cliente_id) ?? "Cliente removido"}
              </p>
              <Badge tone="neutral">{TIPO_LABEL[item.tipo]}</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {formatoData.format(new Date(`${item.data}T12:00:00`))}
              {item.descricao ? ` · ${item.descricao}` : ""}
            </p>
          </div>

          <AcompanhamentoRowActions item={item} clientes={clientes} />
        </div>
      ))}
    </Card>
  );
}
