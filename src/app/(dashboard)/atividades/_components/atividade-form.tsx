"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { registrarAtividade } from "../actions";
import { initialAtividadeFormState } from "../form-state";

const META_LIGACOES = 50;
const HOJE = new Date().toISOString().slice(0, 10);

interface Registro {
  ligacoes_realizadas: number;
  ligacoes_atendidas: number;
  videos_produzidos: number;
  leads_recebidos: number;
  quantidade_vendas: number;
  valor_vendas: number;
  seguros_fechados: number;
}

/**
 * Formulário de atividades — com data editável (padrão: hoje), para
 * registrar/corrigir um dia específico em vez de só "hoje". Trocar a
 * data recarrega os valores já salvos daquele dia (se houver), para
 * não sobrescrever um dia diferente com os números de outro.
 */
export function AtividadeForm({ registroInicial }: { registroInicial: Registro }) {
  const [data, setData] = React.useState(HOJE);
  const [registro, setRegistro] = React.useState<Registro>(registroInicial);
  const [isPending, startTransition] = React.useTransition();
  const [isLoadingDia, setIsLoadingDia] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { showToast } = useToast();

  function atualizarCampo<K extends keyof Registro>(campo: K, valor: number) {
    setRegistro((r) => ({ ...r, [campo]: Math.max(0, valor) }));
  }

  async function handleDataChange(novaData: string) {
    setData(novaData);
    setIsLoadingDia(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: encontrado } = await supabase
        .from("atividades_diarias")
        .select(
          "ligacoes_realizadas, ligacoes_atendidas, videos_produzidos, leads_recebidos, quantidade_vendas, valor_vendas, seguros_fechados"
        )
        .eq("vendedor_id", user.id)
        .eq("data", novaData)
        .maybeSingle();

      setRegistro({
        ligacoes_realizadas: encontrado?.ligacoes_realizadas ?? 0,
        ligacoes_atendidas: encontrado?.ligacoes_atendidas ?? 0,
        videos_produzidos: encontrado?.videos_produzidos ?? 0,
        leads_recebidos: encontrado?.leads_recebidos ?? 0,
        quantidade_vendas: encontrado?.quantidade_vendas ?? 0,
        valor_vendas: encontrado?.valor_vendas ?? 0,
        seguros_fechados: encontrado?.seguros_fechados ?? 0,
      });
    } finally {
      setIsLoadingDia(false);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await registrarAtividade(initialAtividadeFormState, formData);
      if (result.success) {
        setError(null);
        showToast(
          data === HOJE ? "Atividades do dia salvas." : "Atividades salvas para a data selecionada.",
          "success"
        );
      } else {
        setError(result.error);
      }
    });
  }

  const percentualLigacoes = Math.min(1, registro.ligacoes_realizadas / META_LIGACOES);
  const naoAtendidas = Math.max(0, registro.ligacoes_realizadas - registro.ligacoes_atendidas);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{data === HOJE ? "Hoje" : "Registro por data"}</CardTitle>
      </CardHeader>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Data</label>
          <Input
            name="data"
            type="date"
            max={HOJE}
            value={data}
            onChange={(e) => handleDataChange(e.target.value)}
          />
        </div>

        <div className={isLoadingDia ? "flex flex-col gap-4 opacity-50 transition-opacity" : "flex flex-col gap-4 transition-opacity"}>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Ligações realizadas ({registro.ligacoes_realizadas} / {META_LIGACOES})
            </label>
            <Input
              name="ligacoes_realizadas"
              type="number"
              min={0}
              value={registro.ligacoes_realizadas}
              onChange={(e) => atualizarCampo("ligacoes_realizadas", Number(e.target.value) || 0)}
              disabled={isLoadingDia}
            />
            <ProgressBar
              value={percentualLigacoes}
              tone={percentualLigacoes >= 1 ? "success" : "primary"}
              className="mt-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Ligações atendidas ({naoAtendidas} não atendidas)
            </label>
            <Input
              name="ligacoes_atendidas"
              type="number"
              min={0}
              max={registro.ligacoes_realizadas}
              value={registro.ligacoes_atendidas}
              onChange={(e) => atualizarCampo("ligacoes_atendidas", Number(e.target.value) || 0)}
              disabled={isLoadingDia}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Vídeos</label>
              <Input
                name="videos_produzidos"
                type="number"
                min={0}
                value={registro.videos_produzidos}
                onChange={(e) => atualizarCampo("videos_produzidos", Number(e.target.value) || 0)}
                disabled={isLoadingDia}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Leads recebidos</label>
              <Input
                name="leads_recebidos"
                type="number"
                min={0}
                value={registro.leads_recebidos}
                onChange={(e) => atualizarCampo("leads_recebidos", Number(e.target.value) || 0)}
                disabled={isLoadingDia}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Leads são preenchidos manualmente por enquanto — sem integração automática com o
            ChatGuru ainda.
          </p>

          <div className="rounded-lg bg-muted p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Resultado do dia</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Vendas (qtd)</label>
                <Input
                  name="quantidade_vendas"
                  type="number"
                  min={0}
                  value={registro.quantidade_vendas}
                  onChange={(e) => atualizarCampo("quantidade_vendas", Number(e.target.value) || 0)}
                  disabled={isLoadingDia}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Valor (R$)</label>
                <Input
                  name="valor_vendas"
                  type="number"
                  step="0.01"
                  min={0}
                  value={registro.valor_vendas}
                  onChange={(e) => atualizarCampo("valor_vendas", Number(e.target.value) || 0)}
                  disabled={isLoadingDia}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Seguros</label>
                <Input
                  name="seguros_fechados"
                  type="number"
                  min={0}
                  value={registro.seguros_fechados}
                  onChange={(e) => atualizarCampo("seguros_fechados", Number(e.target.value) || 0)}
                  disabled={isLoadingDia}
                />
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" isLoading={isPending} disabled={isLoadingDia} className="self-start">
          Salvar
        </Button>
      </form>
    </Card>
  );
}
