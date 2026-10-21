"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import type { PapelUsuario } from "@/types/database";

/**
 * Navegação mobile (< md): botão no topbar que abre um drawer lateral.
 * Fecha ao navegar, ao tocar fora ou com Esc; trava o scroll do body
 * enquanto aberto.
 */
export function MobileNav({ papel }: { papel?: PapelUsuario }) {
  const [aberto, setAberto] = React.useState(false);
  const pathname = usePathname();
  const itens = NAV_ITEMS.filter((item) => !item.papeis || (papel && item.papeis.includes(papel)));

  React.useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        aria-expanded={aberto}
        className="flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-200",
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!aberto}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
          className="absolute inset-0 bg-black/50"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface px-3 py-4 shadow-xl",
            "transition-transform duration-300 ease-[var(--ease-out-swift)]",
            aberto ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-10 shrink-0 items-center justify-center">
                <Logo variant="mark" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Motochefe</p>
                <p className="text-xs text-muted-foreground">Nexus</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {itens.map((item) => {
              const ativo = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    ativo
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
