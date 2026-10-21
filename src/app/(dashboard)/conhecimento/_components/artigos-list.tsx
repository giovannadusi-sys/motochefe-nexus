import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { CategoriaConhecimento } from "@/types/database";

const CATEGORIA_LABEL: Record<CategoriaConhecimento, string> = {
  produtos: "Produtos",
  especificacoes: "Especificações",
  processos: "Processos",
  garantia: "Garantia",
  treinamentos: "Treinamentos",
};

const ORDEM_CATEGORIAS: CategoriaConhecimento[] = [
  "produtos",
  "especificacoes",
  "processos",
  "garantia",
  "treinamentos",
];

/**
 * Server Component assíncrono — todos os papéis podem ler (RLS já
 * garante isso). Agrupado por categoria, na ordem definida em
 * CONTEXTO.md §17.
 */
export async function ArtigosList() {
  const supabase = await createClient();
  const { data: artigos, error } = await supabase
    .from("artigos_conhecimento")
    .select("id, categoria, titulo, updated_at")
    .order("titulo");

  if (error) {
    console.error("[conhecimento/ArtigosList] erro do Supabase:", error);
    return (
      <EmptyState
        icon={BookOpen}
        title="Não foi possível carregar a base de conhecimento"
        description="Tente recarregar a página."
      />
    );
  }

  if (!artigos || artigos.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhum artigo publicado ainda"
        description="Gerente ou auxiliar administrativa podem usar o botão “Novo artigo” para começar."
      />
    );
  }

  const porCategoria = new Map<CategoriaConhecimento, typeof artigos>();
  for (const artigo of artigos) {
    const lista = porCategoria.get(artigo.categoria) ?? [];
    lista.push(artigo);
    porCategoria.set(artigo.categoria, lista);
  }

  return (
    <div className="flex flex-col gap-6">
      {ORDEM_CATEGORIAS.filter((categoria) => porCategoria.has(categoria)).map((categoria) => (
        <div key={categoria} className="animate-fade-in">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {CATEGORIA_LABEL[categoria]}
          </h2>
          <Card className="divide-y divide-[var(--border-soft)] p-0">
            {porCategoria.get(categoria)!.map((artigo) => (
              <Link
                key={artigo.id}
                href={`/conhecimento/${artigo.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-[var(--duration-fast)] hover:bg-muted"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  {artigo.titulo}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}
