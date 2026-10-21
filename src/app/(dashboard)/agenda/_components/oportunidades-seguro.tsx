import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConverterOportunidadeButton } from "./converter-oportunidade-button";

/**
 * Oportunidades de seguro em aberto — criadas automaticamente pelo
 * módulo de Vendas quando a venda não sai com seguro contratado
 * (BUSINESS_RULES.md §2.2, janela de 120 dias). O botão "Convertido"
 * marca a oportunidade como fechada direto aqui — o que fazer quando o
 * prazo vence sem conversão continua em aberto (BUSINESS_RULES.md §4),
 * por isso não há ação automática nesse caso, só o aviso visual.
 */
export async function OportunidadesSeguro() {
  const supabase = await createClient();
  const { data: oportunidades } = await supabase
    .from("oportunidades_seguro")
    .select("id, cliente_id, data_limite")
    .eq("status", "aberta")
    .order("data_limite", { ascending: true });

  if (!oportunidades || oportunidades.length === 0) {
    return null;
  }

  const clienteIds = [...new Set(oportunidades.map((o) => o.cliente_id))];
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome")
    .in("id", clienteIds);
  const nomeDoCliente = new Map(clientes?.map((c) => [c.id, c.nome]));

  const hoje = new Date();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Oportunidades de seguro em aberto</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {oportunidades.map((op) => {
          const limite = new Date(`${op.data_limite}T12:00:00`);
          const diasRestantes = Math.ceil((limite.getTime() - hoje.getTime()) / 86_400_000);
          const urgente = diasRestantes <= 15;

          return (
            <div key={op.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-foreground">
                {nomeDoCliente.get(op.cliente_id) ?? "Cliente removido"}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={urgente ? "warning" : "neutral"}>
                  {diasRestantes > 0 ? (
                    <>
                      <ShieldAlert className="mr-1 inline size-3" aria-hidden="true" />
                      {diasRestantes} dias restantes
                    </>
                  ) : (
                    "Prazo vencido"
                  )}
                </Badge>
                <ConverterOportunidadeButton id={op.id} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
