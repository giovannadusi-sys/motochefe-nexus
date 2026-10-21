"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  nome: string;
  ligacoesRealizadas: number;
  ligacoesAtendidas: number;
  leads: number;
  videos: number;
  quantidadeVendas: number;
  valorVendas: number;
  seguros: number;
}

/**
 * Linha expansível por vendedor no dashboard do gerente — antes era só
 * uma linha de resumo (ligações + leads + vendido hoje), sem detalhe
 * nenhum além disso.
 */
export function VendedorResumoRow({
  nome,
  ligacoesRealizadas,
  ligacoesAtendidas,
  leads,
  videos,
  quantidadeVendas,
  valorVendas,
  seguros,
}: Props) {
  const [aberto, setAberto] = React.useState(false);
  const naoAtendidas = Math.max(0, ligacoesRealizadas - ligacoesAtendidas);

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors duration-[var(--duration-fast)] hover:bg-muted"
      >
        <p className="text-sm font-medium text-foreground">{nome}</p>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {ligacoesRealizadas} ligações · {leads} leads · {formatoMoeda.format(valorVendas)} hoje
          </p>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)]",
              aberto && "rotate-180"
            )}
          />
        </div>
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
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-soft)] bg-muted/40 px-5 py-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Ligações atendidas</p>
                <p className="text-sm font-medium text-foreground">
                  {ligacoesAtendidas} / {ligacoesRealizadas}
                </p>
                <p className="text-xs text-muted-foreground">{naoAtendidas} não atendidas</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas (qtd)</p>
                <p className="text-sm font-medium text-foreground">{quantidadeVendas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor vendido</p>
                <p className="text-sm font-medium text-foreground">{formatoMoeda.format(valorVendas)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Leads / Vídeos / Seguros</p>
                <p className="text-sm font-medium text-foreground">
                  {leads} / {videos} / {seguros}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
