"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import type { PapelUsuario } from "@/types/database";

/**
 * Navegação lateral da área logada.
 *
 * Motion: o indicador de item ativo usa `layoutId` (Jakub Krehel / FLIP)
 * para deslizar suavemente entre itens ao trocar de rota — é uma pista
 * de orientação funcional (onde eu estou), não decoração. Navegação é
 * de uso frequente ao longo do dia, então a transição fica rápida
 * (~200ms) e sem bounce.
 *
 * Itens com `papeis` restrito (ex: "Equipe") só aparecem para quem tem
 * permissão — evita mostrar um link que vai dar "acesso negado".
 */
export function Sidebar({ papel }: { papel?: PapelUsuario }) {
  const pathname = usePathname();
  const itens = NAV_ITEMS.filter((item) => !item.papeis || (papel && item.papeis.includes(papel)));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border-soft)] bg-surface px-3 py-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-3">
        <div className="flex h-8 w-10 shrink-0 items-center justify-center">
          <Logo variant="mark" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Motochefe</p>
          <p className="text-xs text-muted-foreground">Nexus</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {itens.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                />
              )}
              <Icon className="relative size-4 shrink-0" aria-hidden="true" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
