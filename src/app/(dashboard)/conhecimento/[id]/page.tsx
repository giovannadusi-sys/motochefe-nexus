import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import Markdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditarArtigoButton } from "./_components/editar-artigo-button";
import { ExcluirArtigoButton } from "./_components/excluir-artigo-button";
import type { CategoriaConhecimento } from "@/types/database";

const CATEGORIA_LABEL: Record<CategoriaConhecimento, string> = {
  produtos: "Produtos",
  especificacoes: "Especificações",
  processos: "Processos",
  garantia: "Garantia",
  treinamentos: "Treinamentos",
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default async function ArtigoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artigo } = await supabase
    .from("artigos_conhecimento")
    .select("id, categoria, titulo, conteudo, arquivo_url, link_externo, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!artigo) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = user
    ? await supabase.from("perfis").select("papel").eq("id", user.id).single()
    : { data: null };
  const podeEditar = perfil?.papel === "gerente" || perfil?.papel === "auxiliar_administrativa";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/conhecimento"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Base de Conhecimento
      </Link>

      <Card className="animate-fade-in">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Badge tone="primary" className="mb-2">
              {CATEGORIA_LABEL[artigo.categoria]}
            </Badge>
            <h1 className="text-xl font-semibold text-foreground">{artigo.titulo}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Atualizado em {formatoData.format(new Date(artigo.updated_at))}
            </p>
          </div>

          {podeEditar && (
            <div className="flex shrink-0 items-center gap-1">
              <EditarArtigoButton artigo={artigo} />
              <ExcluirArtigoButton id={artigo.id} />
            </div>
          )}
        </div>

        {(artigo.arquivo_url || artigo.link_externo) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {artigo.arquivo_url && (
              <a
                href={artigo.arquivo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-[var(--duration-fast)] hover:bg-primary/10 hover:text-primary"
              >
                <FileText className="size-3.5" /> Abrir PDF
              </a>
            )}
            {artigo.link_externo && (
              <a
                href={artigo.link_externo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-[var(--duration-fast)] hover:bg-primary/10 hover:text-primary"
              >
                <ExternalLink className="size-3.5" /> Link externo
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 text-sm text-foreground [&_a]:text-primary [&_a]:underline">
          <Markdown
            components={{
              h1: (props) => <h2 className="text-lg font-semibold" {...props} />,
              h2: (props) => <h3 className="text-base font-semibold" {...props} />,
              h3: (props) => <h4 className="text-sm font-semibold" {...props} />,
              p: (props) => <p className="leading-relaxed" {...props} />,
              ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
              ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
              code: (props) => (
                <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props} />
              ),
              strong: (props) => <strong className="font-semibold" {...props} />,
            }}
          >
            {artigo.conteudo}
          </Markdown>
        </div>
      </Card>
    </div>
  );
}
