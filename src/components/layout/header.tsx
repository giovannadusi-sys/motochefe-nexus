import { LogOut } from "lucide-react";
import { logout } from "@/lib/supabase/actions";
import { ThemeToggle } from "./theme-toggle";
import { NotificacoesBell } from "./notificacoes-bell";
import { MobileNav } from "./mobile-nav";
import type { PapelUsuario } from "@/types/database";

interface HeaderProps {
  unidadeNome?: string;
  userName?: string;
  papel?: PapelUsuario;
}

/**
 * Cabeçalho da área logada. `unidadeNome` e `userName` vêm de dados
 * reais buscados no layout (Etapa 6+) — sem eles, mostra um traço
 * neutro em vez de inventar um placeholder de exemplo.
 */
export function Header({ unidadeNome = "—", userName, papel }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-soft)] bg-surface px-3 sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav papel={papel} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{unidadeNome}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">Unidade comercial</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {userName && (
          <span className="mr-2 hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">
            {userName}
          </span>
        )}
        <ThemeToggle />
        <NotificacoesBell />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sair da conta"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </form>
        <div className="hidden size-9 rounded-full bg-muted sm:block" aria-hidden="true" />
      </div>
    </header>
  );
}
