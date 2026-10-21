import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NovaVendaButton } from "./_components/nova-venda-button";
import { VendasList } from "./_components/vendas-list";
import { VendasListSkeleton } from "./_components/vendas-list-skeleton";

export const metadata = { title: "Vendas — Motochefe Nexus" };

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const params = await searchParams;
  const dataDe = params.de && DATA_ISO.test(params.de) ? params.de : undefined;
  const dataAte = params.ate && DATA_ISO.test(params.ate) ? params.ate : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel").eq("id", user.id).single()
    : { data: null };

  // Decisão confirmada: só o vendedor registra a própria venda — o
  // botão nem aparece para gerente/auxiliar (que só acompanham).
  const podeRegistrarVenda = perfil?.papel === "vendedor";

  // Buscado sempre (não só para vendedor): o modal de edição, usado
  // por qualquer papel com permissão de editar (RLS cobre isso),
  // também precisa da lista de clientes para o <select>.
  const { data: clientes } = await supabase.from("clientes").select("id, nome").order("nome");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Registro centralizado de vendas da unidade.
          </p>
        </div>

        {podeRegistrarVenda &&
          (clientes && clientes.length > 0 ? (
            <NovaVendaButton clientes={clientes} />
          ) : (
            <Link
              href="/clientes"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform,background-color] duration-[var(--duration-fast)] ease-[var(--ease-out-swift)] hover:bg-primary-hover active:scale-[0.97]"
            >
              Cadastre um cliente primeiro
            </Link>
          ))}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          De
          <input
            type="date"
            name="de"
            defaultValue={dataDe}
            className="h-10 rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Até
          <input
            type="date"
            name="ate"
            defaultValue={dataAte}
            className="h-10 rounded-lg bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-card)] outline-none"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform,background-color] duration-[var(--duration-fast)] hover:bg-primary-hover active:scale-[0.97]"
        >
          Filtrar
        </button>
        {(dataDe || dataAte) && (
          <Link
            href="/vendas"
            className="h-10 content-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Limpar filtro
          </Link>
        )}
      </form>

      <Suspense key={`${dataDe ?? ""}-${dataAte ?? ""}`} fallback={<VendasListSkeleton />}>
        <VendasList clientesDisponiveis={clientes ?? []} dataDe={dataDe} dataAte={dataAte} />
      </Suspense>
    </div>
  );
}
