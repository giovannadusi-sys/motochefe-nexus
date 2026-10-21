"use client";

import { Pencil } from "lucide-react";
import { ArtigoModal } from "../../_components/artigo-modal";
import type { CategoriaConhecimento } from "@/types/database";

interface Props {
  artigo: {
    id: string;
    categoria: CategoriaConhecimento;
    titulo: string;
    conteudo: string;
    arquivo_url: string | null;
    link_externo: string | null;
  };
}

/** Mesmo motivo do NovoArtigoButton: trigger precisa nascer no cliente. */
export function EditarArtigoButton({ artigo }: Props) {
  return (
    <ArtigoModal
      inicial={artigo}
      trigger={(abrir) => (
        <button
          onClick={abrir}
          aria-label="Editar artigo"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    />
  );
}
