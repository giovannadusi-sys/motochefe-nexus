"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AcompanhamentoModal } from "./acompanhamento-modal";

interface ClienteOption {
  id: string;
  nome: string;
}

/**
 * Wrapper Client Component em torno do `AcompanhamentoModal`.
 *
 * Existe porque Server Components não podem passar funções como
 * props para Client Components — o `trigger` (render prop) do modal
 * só pode ser criado aqui dentro, no lado do cliente. A página
 * (Server Component) só passa `clientes`, que é um array de objetos
 * simples — serializável, sem problema nenhum.
 */
export function NovoAcompanhamentoButton({ clientes }: { clientes: ClienteOption[] }) {
  return (
    <AcompanhamentoModal
      clientes={clientes}
      trigger={(abrir) => (
        <Button onClick={abrir}>
          <Plus className="size-4" aria-hidden="true" />
          Novo acompanhamento
        </Button>
      )}
    />
  );
}
