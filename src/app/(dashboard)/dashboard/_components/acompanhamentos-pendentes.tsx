import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { TipoAcompanhamento } from "@/types/database";

const TIPO_LABEL: Record<TipoAcompanhamento, string> = {
  follow_up: "Follow-up",
  retorno: "Retorno",
  seguro: "Seguro",
  revisao: "Revisão",
  pos_venda: "Pós-venda",
  outro: "Outro",
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const LIMITE_ITENS = 5;

/**
 * Antes era um `EmptyState` fixo, nunca conectado à Agenda de verdade
 * — o texto até dizia "quando o CRM estiver ativo", mas o CRM já
 * estava ativo há várias etapas. Agora lê direto de `acompanhamentos`
 * (mesma tabela/RLS da página /agenda).
 */
export async function AcompanhamentosPendentesDashboard() {
  const supabase = await createClient();
  const { data: itens } = await supabase
    .from("acompanhamentos")
    .select("id, cliente_id, tipo, data")
    .eq("status", "pendente")
    .order("data", { ascending: true })
    .limit(LIMITE_ITENS);

  if (!itens || itens.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nenhum acompanhamento pendente"
        description="Follow-ups, retornos e revisões agendados na Agenda aparecem aqui."
      />
    );
  }

  const clienteIds = [...new Set(itens.map((i) => i.cliente_id))];
  const { data: clientes } = await supabase.from("clientes").select("id, nome").in("id", clienteIds);
  const nomePorId = new Map(clientes?.map((c) => [c.id, c.nome]));

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle>Acompanhamentos pendentes</CardTitle>
        <Link href="/agenda" className="text-xs text-primary hover:underline">
          Ver agenda completa
        </Link>
      </CardHeader>
      {itens.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {nomePorId.get(item.cliente_id) ?? "Cliente removido"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatoData.format(new Date(`${item.data}T12:00:00`))}
            </p>
          </div>
          <Badge tone="neutral">{TIPO_LABEL[item.tipo]}</Badge>
        </div>
      ))}
    </Card>
  );
}
