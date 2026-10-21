import { Suspense } from "react";
import { NovoClienteButton } from "./_components/novo-cliente-button";
import { ClientesList } from "./_components/clientes-list";
import { ClientesListSkeleton } from "./_components/clientes-list-skeleton";

export const metadata = { title: "Clientes — Motochefe Nexus" };

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            CRM da unidade — cadastro e histórico de contato.
          </p>
        </div>
        <NovoClienteButton />
      </div>

      <Suspense fallback={<ClientesListSkeleton />}>
        <ClientesList />
      </Suspense>
    </div>
  );
}
