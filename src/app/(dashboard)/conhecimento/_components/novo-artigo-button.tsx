"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtigoModal } from "./artigo-modal";

/**
 * Wrapper Client Component em torno do `ArtigoModal` — mesmo motivo do
 * `NovoAcompanhamentoButton`: o `trigger` (render prop) não pode vir de
 * um Server Component, então esse wrapper existe só para criar essa
 * função inteiramente do lado do cliente.
 */
export function NovoArtigoButton() {
  return (
    <ArtigoModal
      trigger={(abrir) => (
        <Button onClick={abrir}>
          <Plus className="size-4" aria-hidden="true" />
          Novo artigo
        </Button>
      )}
    />
  );
}
