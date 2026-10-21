import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { NovoAcompanhamentoButton } from "./_components/novo-acompanhamento-button";
import { AcompanhamentosList } from "./_components/acompanhamentos-list";
import { AcompanhamentosListSkeleton } from "./_components/acompanhamentos-list-skeleton";
import { OportunidadesSeguro } from "./_components/oportunidades-seguro";

export const metadata = { title: "Agenda — Motochefe Nexus" };

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase.from("clientes").select("id, nome").order("nome");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Follow-ups, retornos, seguro, revisão e pós-venda.
          </p>
        </div>
        <NovoAcompanhamentoButton clientes={clientes ?? []} />
      </div>

      <Suspense fallback={null}>
        <OportunidadesSeguro />
      </Suspense>

      <Suspense fallback={<AcompanhamentosListSkeleton />}>
        <AcompanhamentosList clientes={clientes ?? []} />
      </Suspense>
    </div>
  );
}
