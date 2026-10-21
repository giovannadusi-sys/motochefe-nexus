import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function IaNaoConfigurada() {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center animate-fade-in">
      <div className="flex size-12 items-center justify-center rounded-full bg-warning-bg text-warning">
        <Sparkles className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Assistente IA ainda não configurado</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Preencha <code className="rounded bg-muted px-1 py-0.5 text-xs">GEMINI_API_KEY</code> no{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>. O passo a passo
        está em{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/ASSISTENTE_IA_SETUP.md</code>.
      </p>
    </Card>
  );
}
