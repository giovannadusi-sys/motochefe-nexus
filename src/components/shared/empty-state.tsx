import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Estado vazio/placeholder padrão para módulos ainda não implementados
 * (Etapa 1). Um empty state é um convite à ação, não um pedido de
 * desculpas — por isso descreve o que a área vai fazer, não "em breve".
 */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center animate-fade-in">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
