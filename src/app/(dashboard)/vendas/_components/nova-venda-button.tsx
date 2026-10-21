"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendaModal } from "./venda-modal";

interface ClienteOption {
  id: string;
  nome: string;
}

export function NovaVendaButton({ clientes }: { clientes: ClienteOption[] }) {
  return (
    <VendaModal
      clientes={clientes}
      trigger={(abrir) => (
        <Button onClick={abrir}>
          <Plus className="size-4" aria-hidden="true" />
          Nova venda
        </Button>
      )}
    />
  );
}
