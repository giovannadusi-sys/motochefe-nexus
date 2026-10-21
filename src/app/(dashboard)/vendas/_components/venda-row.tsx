"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Pencil, Trash2, Gift, Truck, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { excluirVenda } from "../actions";
import { VendaModal } from "./venda-modal";
import type { FormaPagamento } from "@/types/database";
import type { VendaAtualizada } from "../form-state";

const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  avista: "À vista",
  parcelado: "Parcelado",
  outro: "Outro",
};

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
}

interface ClienteOption {
  id: string;
  nome: string;
}

export function VendaRow({
  venda,
  cliente,
  clientesDisponiveis,
  onExcluida,
  onAtualizada,
}: {
  venda: VendaAtualizada;
  cliente: Cliente | undefined;
  clientesDisponiveis: ClienteOption[];
  onExcluida: (id: string) => void;
  onAtualizada: (venda: VendaAtualizada) => void;
}) {
  const [aberto, setAberto] = React.useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = React.useState(false);
  const [isPendingExcluir, startExcluir] = React.useTransition();
  const { showToast } = useToast();

  React.useEffect(() => {
    if (!confirmandoExclusao) return;
    const t = window.setTimeout(() => setConfirmandoExclusao(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmandoExclusao]);

  function handleExcluir(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmandoExclusao) {
      setConfirmandoExclusao(true);
      return;
    }
    startExcluir(async () => {
      const resultado = await excluirVenda(venda.id);
      if (resultado.error) {
        showToast(resultado.error, "danger");
        setConfirmandoExclusao(false);
        return;
      }
      showToast("Venda excluída.", "success");
      onExcluida(venda.id);
    });
  }

  return (
    <div>
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-left sm:px-5 transition-colors duration-[var(--duration-fast)] hover:bg-muted"
      >
        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate text-sm font-medium text-foreground">
            {cliente?.nome ?? "Cliente removido"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {venda.modelo_moto}
            {venda.cor ? ` · ${venda.cor}` : ""} · {formatoData.format(new Date(`${venda.data_venda}T12:00:00`))}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!venda.seguro_contratado && <Badge tone="warning">Sem seguro</Badge>}
          <Badge tone="neutral">
            {FORMA_PAGAMENTO_LABEL[venda.forma_pagamento]}
            {venda.detalhe_pagamento ? ` · ${venda.detalhe_pagamento.toUpperCase()}` : ""}
          </Badge>
          <span className="min-w-24 text-right text-sm font-medium text-foreground">
            {formatoMoeda.format(venda.valor)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-[var(--duration-fast)]",
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
            <div className="grid grid-cols-1 gap-4 border-t border-[var(--border-soft)] bg-muted/40 px-4 py-4 sm:grid-cols-2 sm:px-5">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Cliente</p>
                <p className="text-sm text-foreground">{cliente?.nome ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{cliente?.telefone ?? "sem telefone"}</p>
                <p className="text-xs text-muted-foreground">{cliente?.email ?? "sem e-mail"}</p>
                {cliente?.cpf && <p className="text-xs text-muted-foreground">CPF: {cliente.cpf}</p>}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Veículo</p>
                <p className="text-sm text-foreground">
                  {venda.modelo_moto}
                  {venda.cor ? ` · ${venda.cor}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Chassi: {venda.chassi ?? "não informado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valor do veículo: {formatoMoeda.format(venda.valor)}
                </p>
              </div>

              {venda.acessorios.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Package className="size-3.5" /> Acessórios (à parte do veículo)
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {venda.acessorios.map((a) => (
                      <Badge key={a.nome} tone="neutral">
                        {a.nome} — {formatoMoeda.format(a.valor)}
                      </Badge>
                    ))}
                    <span className="text-xs font-medium text-foreground">
                      Total acessórios: {formatoMoeda.format(venda.valor_acessorios)}
                    </span>
                  </div>
                </div>
              )}

              {(venda.origem_cliente || venda.teve_brinde || venda.teve_frete || venda.observacoes) && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Informações adicionais
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {venda.origem_cliente && <Badge tone="primary">{venda.origem_cliente}</Badge>}
                    {venda.teve_brinde && (
                      <Badge tone="success">
                        <Gift className="mr-1 inline size-3" /> Brinde
                      </Badge>
                    )}
                    {venda.teve_frete && (
                      <Badge tone="success">
                        <Truck className="mr-1 inline size-3" /> Frete
                      </Badge>
                    )}
                  </div>
                  {venda.observacoes && (
                    <p className="mt-2 text-xs text-muted-foreground">{venda.observacoes}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 sm:col-span-2">
                <VendaModal
                  clientes={clientesDisponiveis}
                  inicial={venda}
                  onSuccess={onAtualizada}
                  trigger={(abrir) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        abrir();
                      }}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-3.5" /> Editar
                    </button>
                  )}
                />
                <motion.button
                  onClick={handleExcluir}
                  disabled={isPendingExcluir}
                  animate={{ width: confirmandoExclusao ? "auto" : "fit-content" }}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors duration-[var(--duration-fast)]",
                    confirmandoExclusao
                      ? "bg-danger-bg text-danger"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Trash2 className="size-3.5" />
                  {confirmandoExclusao ? "Confirmar exclusão?" : "Excluir"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
