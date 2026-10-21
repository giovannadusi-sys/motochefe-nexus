"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Copy, Check, ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { criarUsuario } from "../actions";
import { initialCriarUsuarioState } from "../form-state";

function gerarSenhaTemporaria() {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const valores = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(valores, (v) => alfabeto[v % alfabeto.length]).join("");
}

function CampoComCopiar({ label, valor }: { label: string; valor: string }) {
  const [copiado, setCopiado] = React.useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <code className="flex-1 truncate text-sm text-foreground">{valor}</code>
        <button
          onClick={copiar}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {copiado ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}

const selectClassName = cn(
  "h-10 w-full rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none",
  "transition-shadow duration-[var(--duration-fast)] ease-[var(--ease-out-swift)]",
  "focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_rgba(47,95,246,0.15)]"
);

export function ConvidarUsuarioButton() {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sucesso, setSucesso] = React.useState<typeof initialCriarUsuarioState.sucesso>(null);
  const [senha, setSenha] = React.useState(() => gerarSenhaTemporaria());
  const [isPending, startTransition] = React.useTransition();
  const { showToast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  function fecharTudo() {
    setOpen(false);
    setError(null);
    setSucesso(null);
    setSenha(gerarSenhaTemporaria());
    formRef.current?.reset();
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await criarUsuario(initialCriarUsuarioState, formData);
      if (result.sucesso) {
        setError(null);
        setSucesso(result.sucesso);
        showToast("Usuário criado com sucesso.", "success");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Convidar usuário
      </Button>

      <Modal
        open={open}
        onClose={fecharTudo}
        title={sucesso ? "Usuário criado" : "Convidar usuário"}
        maxWidth="max-w-md"
        disableBackdropClose={Boolean(sucesso)}
        hideCloseButton={Boolean(sucesso)}
      >
        <AnimatePresence mode="wait">
          {sucesso ? (
            <motion.div
              key="sucesso"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-start gap-2 rounded-lg bg-warning-bg p-3 text-warning">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p className="text-xs">
                  Essa senha não vai aparecer de novo. Copie e repasse para{" "}
                  <strong>{sucesso.nome}</strong> por um canal seguro agora.
                </p>
              </div>

              <CampoComCopiar label="E-mail" valor={sucesso.email} />
              <CampoComCopiar label="Senha temporária" valor={sucesso.senha} />

              <Button onClick={fecharTudo} className="mt-1 w-full">
                Concluir
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              ref={formRef}
              action={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <Input name="nome" placeholder="Nome completo *" required />
              <Input name="email" type="email" placeholder="E-mail *" required />

              <select name="papel" required defaultValue="vendedor" className={selectClassName}>
                <option value="vendedor">Vendedor</option>
                <option value="gerente">Gerente</option>
                <option value="auxiliar_administrativa">Auxiliar administrativa</option>
              </select>

              <div className="flex gap-2">
                <Input
                  name="senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha temporária *"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSenha(gerarSenhaTemporaria())}
                  aria-label="Gerar nova senha temporária"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Você vai repassar essa senha manualmente — o usuário pode trocá-la depois.
              </p>

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
                <Button type="button" variant="ghost" onClick={fecharTudo}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isPending}>
                  Criar usuário
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
}
