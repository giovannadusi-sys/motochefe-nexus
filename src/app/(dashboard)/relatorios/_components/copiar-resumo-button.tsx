"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopiarResumoButton({ resumo }: { resumo: string }) {
  const [copiado, setCopiado] = React.useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(resumo);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <Button variant="secondary" onClick={copiar}>
      {copiado ? (
        <>
          <Check className="size-4 text-success" /> Copiado
        </>
      ) : (
        <>
          <Copy className="size-4" /> Copiar resumo
        </>
      )}
    </Button>
  );
}
