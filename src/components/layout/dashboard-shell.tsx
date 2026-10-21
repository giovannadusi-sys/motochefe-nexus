import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/shared/page-transition";
import type { PapelUsuario } from "@/types/database";

interface DashboardShellProps {
  children: React.ReactNode;
  unidadeNome?: string;
  userName?: string;
  papel?: PapelUsuario;
}

/**
 * Estrutura compartilhada de toda a área logada (dashboard, clientes,
 * vendas, metas...). Cada página recebe a transição de entrada/saída
 * automaticamente via `PageTransition`.
 */
export function DashboardShell({ children, unidadeNome, userName, papel }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar papel={papel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header unidadeNome={unidadeNome} userName={userName} papel={papel} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
