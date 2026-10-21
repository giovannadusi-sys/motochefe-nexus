"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

const META_LIGACOES = 50;

interface Props {
  nome: string;
  ligacoes: number;
  videos: number;
  leads: number;
}

export function AtividadeVendedorRow({ nome, ligacoes, videos, leads }: Props) {
  const [aberto, setAberto] = React.useState(false);
  const percentual = Math.min(1, ligacoes / META_LIGACOES);

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-[var(--duration-fast)] hover:bg-muted"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">{nome}</p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {ligacoes} / {META_LIGACOES} ligações · {videos} vídeos
            </p>
          </div>
          <ProgressBar value={percentual} tone={percentual >= 1 ? "success" : "primary"} />
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)]",
            aberto && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-[var(--border-soft)] bg-muted/40 px-5 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Ligações</p>
                <p className="text-sm font-medium text-foreground">{ligacoes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads</p>
                <p className="text-sm font-medium text-foreground">{leads}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vídeos</p>
                <p className="text-sm font-medium text-foreground">{videos}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
