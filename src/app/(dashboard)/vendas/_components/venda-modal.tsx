"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { criarVenda, atualizarVenda } from "../actions";
import { initialVendaFormState, type VendaAtualizada } from "../form-state";
import { ACESSORIOS_DISPONIVEIS } from "@/config/acessorios";

interface ClienteOption {
  id: string;
  nome: string;
}

type FormaPagamento = "avista" | "parcelado" | "outro";

const PARCELAS = Array.from({ length: 21 }, (_, i) => `${i + 1}x`);

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  clientes: ClienteOption[];
  inicial?: VendaAtualizada;
  onSuccess?: (venda: VendaAtualizada) => void;
  trigger: (abrir: () => void) => React.ReactNode;
}

const selectClassName = cn(
  "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
  "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
  "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
);

const HOJE = new Date().toISOString().slice(0, 10);

/**
 * Modal único para registrar e editar vendas. `trigger` nasce sempre no
 * lado do cliente (quem usa este componente decide o botão/ícone).
 */
export function VendaModal({ clientes, inicial, trigger, onSuccess }: Props) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [formaPagamento, setFormaPagamento] = React.useState<FormaPagamento>(
    inicial?.forma_pagamento ?? "avista"
  );
  const { showToast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);
  const modoEdicao = Boolean(inicial);

  function fechar() {
    setOpen(false);
    setError(null);
    formRef.current?.reset();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = modoEdicao ? atualizarVenda : criarVenda;
      const result = await action(initialVendaFormState, formData);
      if (result.success) {
        if (result.venda) onSuccess?.(result.venda);
        fechar();
        showToast(modoEdicao ? "Venda atualizada." : "Venda registrada com sucesso.", "success");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {trigger(() => setOpen(true))}

      <Modal
        open={open}
        onClose={fechar}
        title={modoEdicao ? "Editar venda" : "Nova venda"}
        maxWidth="max-w-lg"
      >
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          {modoEdicao && <input type="hidden" name="id" value={inicial!.id} />}

          <select
            name="cliente_id"
            required
            defaultValue={inicial?.cliente_id ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              name="modelo_moto"
              placeholder="Modelo da moto *"
              defaultValue={inicial?.modelo_moto}
              required
            />
            <Input name="cor" placeholder="Cor" defaultValue={inicial?.cor ?? ""} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Data da venda</label>
              <Input
                name="data_venda"
                type="date"
                max={HOJE}
                defaultValue={inicial?.data_venda ?? HOJE}
              />
            </div>
            <Input
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Valor do veículo (R$) *"
              defaultValue={inicial?.valor}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="forma_pagamento"
              required
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
              className={selectClassName}
            >
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
              <option value="outro">Outro</option>
            </select>

            {formaPagamento === "avista" && (
              <select
                name="detalhe_pagamento"
                defaultValue={inicial?.detalhe_pagamento ?? "pix"}
                className={selectClassName}
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            )}
            {formaPagamento === "parcelado" && (
              <select
                name="detalhe_pagamento"
                defaultValue={inicial?.detalhe_pagamento ?? "12x"}
                className={selectClassName}
              >
                {PARCELAS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input name="chassi" placeholder="Chassi do veículo" defaultValue={inicial?.chassi ?? ""} />

          <Checkbox
            name="seguro_contratado"
            label="Cliente contratou seguro nesta venda"
            defaultChecked={inicial?.seguro_contratado}
          />
          {!modoEdicao && (
            <p className="-mt-1 text-xs text-muted-foreground">
              Desmarcado, o sistema cria automaticamente uma oportunidade de seguro (janela de 120
              dias) e uma revisão prevista para 3 meses após a venda.
            </p>
          )}

          <div className="rounded-lg bg-muted p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Acessórios</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Vendidos à parte: não somam no valor do veículo.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ACESSORIOS_DISPONIVEIS.map((a) => (
                <Checkbox
                  key={a.id}
                  name="acessorios"
                  value={a.id}
                  label={`${a.nome} — ${formatoMoeda.format(a.valor)}`}
                  defaultChecked={inicial?.acessorios.some((x) => x.nome === a.nome)}
                />
              ))}
            </div>
          </div>

          <div className="mt-1 rounded-lg bg-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Informações adicionais</p>
            <div className="flex flex-col gap-2">
              <Input
                name="origem_cliente"
                placeholder="Origem do cliente (indicação, redes sociais, loja...)"
                defaultValue={inicial?.origem_cliente ?? ""}
              />
              <div className="flex gap-4">
                <Checkbox name="teve_brinde" label="Teve brinde" defaultChecked={inicial?.teve_brinde} />
                <Checkbox name="teve_frete" label="Teve frete" defaultChecked={inicial?.teve_frete} />
              </div>
              <textarea
                name="observacoes"
                rows={2}
                placeholder="Observações (opcional)"
                defaultValue={inicial?.observacoes ?? ""}
                className={cn(
                  "w-full resize-y rounded-lg bg-surface p-2.5 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
                  "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
                  "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
                )}
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
                className="overflow-hidden text-sm text-danger"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              {modoEdicao ? "Salvar alterações" : "Registrar venda"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
