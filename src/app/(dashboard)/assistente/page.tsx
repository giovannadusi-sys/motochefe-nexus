import { isGeminiConfigured } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import { AssistenteChat } from "./_components/assistente-chat";
import { IaNaoConfigurada } from "./_components/ia-nao-configurada";
import type { PapelMensagemIa } from "@/types/database";

export const metadata = { title: "Assistente IA — Motochefe Nexus" };

interface MensagemInicial {
  id: string;
  role: PapelMensagemIa;
  parts: { type: "text"; text: string }[];
}

const LIMITE_HISTORICO_CARREGADO = 30;

export default async function AssistentePage() {
  if (!isGeminiConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">
            A IA organiza, analisa e sugere — quem decide é sempre você.
          </p>
        </div>
        <IaNaoConfigurada />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let mensagensIniciais: MensagemInicial[] = [];

  if (user) {
    const { data: historico } = await supabase
      .from("mensagens_assistente")
      .select("id, papel, conteudo, created_at")
      .eq("usuario_id", user.id)
      .order("created_at", { ascending: false })
      .limit(LIMITE_HISTORICO_CARREGADO);

    mensagensIniciais = (historico ?? [])
      .slice()
      .reverse()
      .map((m) => ({
        id: m.id,
        role: m.papel,
        parts: [{ type: "text" as const, text: m.conteudo }],
      }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Assistente IA</h1>
        <p className="text-sm text-muted-foreground">
          A IA organiza, analisa e sugere — quem decide é sempre você. Respostas baseadas na Base
          de Conhecimento da unidade.
        </p>
      </div>

      <AssistenteChat mensagensIniciais={mensagensIniciais} />
    </div>
  );
}
