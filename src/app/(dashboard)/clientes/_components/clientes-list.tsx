import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

/**
 * Server Component assíncrono — busca os clientes reais da unidade do
 * usuário logado (RLS filtra automaticamente, não precisamos repetir o
 * filtro de unidade aqui). Renderizado dentro de `<Suspense>` na page.
 */
export async function ClientesList() {
  const supabase = await createClient();
  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email, cpf")
    .order("nome");

  if (error) {
    console.error("[clientes/ClientesList] erro do Supabase:", error);
    return (
      <EmptyState
        icon={Users}
        title="Não foi possível carregar os clientes"
        description="Tente recarregar a página. Se o erro continuar, confira a conexão com o Supabase em docs/SUPABASE_SETUP.md."
      />
    );
  }

  if (!clientes || clientes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente cadastrado ainda"
        description="Use o botão “Novo cliente” acima para cadastrar o primeiro da unidade."
      />
    );
  }

  return (
    <Card className="animate-fade-in divide-y divide-[var(--border-soft)] p-0">
      {clientes.map((cliente) => (
        <div
          key={cliente.id}
          className="flex items-center justify-between gap-4 px-5 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{cliente.nome}</p>
            <p className="truncate text-xs text-muted-foreground">
              {cliente.telefone ?? "sem telefone"}
              {cliente.email ? ` · ${cliente.email}` : ""}
            </p>
          </div>
          {cliente.cpf && (
            <Badge tone="neutral" className="shrink-0">
              {cliente.cpf}
            </Badge>
          )}
        </div>
      ))}
    </Card>
  );
}
