"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { converterOportunidadeSeguro } from "../actions";

export function ConverterOportunidadeButton({ id }: { id: string }) {
  const [isPending, startTransition] = React.useTransition();
  const { showToast } = useToast();

  function handleClick() {
    startTransition(async () => {
      await converterOportunidadeSeguro(id);
      showToast("Oportunidade marcada como convertida.", "success");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-success transition-colors duration-[var(--duration-fast)] hover:bg-success-bg disabled:opacity-50"
    >
      <Check className="size-3" aria-hidden="true" />
      Convertido
    </button>
  );
}
