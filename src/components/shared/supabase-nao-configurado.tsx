import { DatabaseZap } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Exibida no lugar da área logada quando `.env.local` ainda não tem as
 * chaves do Supabase preenchidas. Evita um 500 cru — orienta o próximo
 * passo real (docs/SUPABASE_SETUP.md).
 */
export function SupabaseNaoConfigurado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="flex max-w-md flex-col items-center gap-3 py-12 text-center animate-fade-in">
        <div className="flex size-12 items-center justify-center rounded-full bg-warning-bg text-warning">
          <DatabaseZap className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-base font-semibold text-foreground">
          Supabase ainda não configurado
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> com
          a URL e a chave anônima do seu projeto Supabase. O passo a passo completo está em{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/SUPABASE_SETUP.md</code>.
        </p>
      </Card>
    </div>
  );
}
