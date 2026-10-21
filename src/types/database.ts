/**
 * Tipos gerados manualmente a partir de `supabase/migrations/`.
 *
 * Quando o projeto estiver linkado a um Supabase real, prefira
 * regenerar com:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 * Isso garante que o tipo nunca fique dessincronizado do schema.
 */

export type PapelUsuario = "vendedor" | "gerente" | "auxiliar_administrativa";
export type FormaPagamento = "avista" | "parcelado" | "outro";
export type StatusOportunidadeSeguro = "aberta" | "convertida" | "expirada";
export type StatusRevisao = "pendente" | "concluida";
export type TipoAcompanhamento =
  | "follow_up"
  | "retorno"
  | "seguro"
  | "revisao"
  | "pos_venda"
  | "outro";
export type StatusAcompanhamento = "pendente" | "concluido" | "cancelado";
export type CategoriaConhecimento =
  | "produtos"
  | "especificacoes"
  | "processos"
  | "garantia"
  | "treinamentos";
export type PapelMensagemIa = "user" | "assistant";

export interface Database {
  public: {
    Tables: {
      unidades: {
        Row: {
          id: string;
          empresa_nome: string;
          nome: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["unidades"]["Row"]> & {
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["unidades"]["Row"]>;
        Relationships: [];
      };
      perfis: {
        Row: {
          id: string;
          unidade_id: string;
          papel: PapelUsuario;
          nome: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["perfis"]["Row"]> & {
          id: string;
          unidade_id: string;
          papel: PapelUsuario;
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["perfis"]["Row"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          unidade_id: string;
          nome: string;
          cpf: string | null;
          telefone: string | null;
          data_nascimento: string | null;
          email: string | null;
          endereco: string | null;
          cep: string | null;
          bairro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clientes"]["Row"]> & {
          unidade_id: string;
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Row"]>;
        Relationships: [];
      };
      vendas: {
        Row: {
          id: string;
          unidade_id: string;
          cliente_id: string;
          vendedor_id: string;
          data_venda: string;
          modelo_moto: string;
          cor: string | null;
          valor: number;
          forma_pagamento: FormaPagamento;
          detalhe_pagamento: string | null;
          seguro_contratado: boolean;
          chassi: string | null;
          origem_cliente: string | null;
          teve_brinde: boolean;
          teve_frete: boolean;
          observacoes: string | null;
          acessorios: { nome: string; valor: number }[];
          valor_acessorios: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendas"]["Row"]> & {
          unidade_id: string;
          cliente_id: string;
          vendedor_id: string;
          modelo_moto: string;
          valor: number;
        };
        Update: Partial<Database["public"]["Tables"]["vendas"]["Row"]>;
        Relationships: [];
      };
      metas_mensais: {
        Row: {
          id: string;
          vendedor_id: string;
          unidade_id: string;
          mes_referencia: string;
          meta_valor: number;
          deficit_anterior: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["metas_mensais"]["Row"]> & {
          vendedor_id: string;
          unidade_id: string;
          mes_referencia: string;
        };
        Update: Partial<Database["public"]["Tables"]["metas_mensais"]["Row"]>;
        Relationships: [];
      };
      oportunidades_seguro: {
        Row: {
          id: string;
          unidade_id: string;
          cliente_id: string;
          venda_id: string;
          vendedor_id: string;
          data_criacao: string;
          data_limite: string;
          status: StatusOportunidadeSeguro;
          data_conversao: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["oportunidades_seguro"]["Row"]> & {
          unidade_id: string;
          cliente_id: string;
          venda_id: string;
          vendedor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["oportunidades_seguro"]["Row"]>;
        Relationships: [];
      };
      revisoes: {
        Row: {
          id: string;
          unidade_id: string;
          venda_id: string;
          cliente_id: string;
          data_prevista: string;
          km_previsto: number;
          status: StatusRevisao;
          data_conclusao: string | null;
          km_registrado: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["revisoes"]["Row"]> & {
          unidade_id: string;
          venda_id: string;
          cliente_id: string;
          data_prevista: string;
        };
        Update: Partial<Database["public"]["Tables"]["revisoes"]["Row"]>;
        Relationships: [];
      };
      acompanhamentos: {
        Row: {
          id: string;
          unidade_id: string;
          cliente_id: string;
          responsavel_id: string;
          tipo: TipoAcompanhamento;
          descricao: string | null;
          data: string;
          status: StatusAcompanhamento;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["acompanhamentos"]["Row"]> & {
          unidade_id: string;
          cliente_id: string;
          responsavel_id: string;
          tipo: TipoAcompanhamento;
        };
        Update: Partial<Database["public"]["Tables"]["acompanhamentos"]["Row"]>;
        Relationships: [];
      };
      atividades_diarias: {
        Row: {
          id: string;
          vendedor_id: string;
          unidade_id: string;
          data: string;
          ligacoes_realizadas: number;
          ligacoes_atendidas: number;
          videos_produzidos: number;
          leads_recebidos: number;
          quantidade_vendas: number;
          valor_vendas: number;
          seguros_fechados: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["atividades_diarias"]["Row"]> & {
          vendedor_id: string;
          unidade_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["atividades_diarias"]["Row"]>;
        Relationships: [];
      };
      artigos_conhecimento: {
        Row: {
          id: string;
          unidade_id: string;
          categoria: CategoriaConhecimento;
          titulo: string;
          conteudo: string;
          arquivo_url: string | null;
          link_externo: string | null;
          autor_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["artigos_conhecimento"]["Row"]> & {
          unidade_id: string;
          categoria: CategoriaConhecimento;
          titulo: string;
          conteudo: string;
          autor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["artigos_conhecimento"]["Row"]>;
        Relationships: [];
      };
      mensagens_assistente: {
        Row: {
          id: string;
          unidade_id: string;
          usuario_id: string;
          papel: PapelMensagemIa;
          conteudo: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["mensagens_assistente"]["Row"]> & {
          unidade_id: string;
          usuario_id: string;
          papel: PapelMensagemIa;
          conteudo: string;
        };
        Update: Partial<Database["public"]["Tables"]["mensagens_assistente"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      ranking_mensal: {
        Row: {
          unidade_id: string;
          vendedor_id: string;
          vendedor_nome: string;
          mes_referencia: string;
          total_vendido: number;
          quantidade_vendas: number;
          posicao: number;
        };
        Relationships: [];
      };
      metas_progresso: {
        Row: {
          meta_id: string;
          vendedor_id: string;
          unidade_id: string;
          mes_referencia: string;
          meta_valor: number;
          deficit_anterior: number;
          total_vendido: number;
          saldo_faltante: number;
          comissao_liberada: boolean;
        };
        Relationships: [];
      };
    };
    Enums: {
      papel_usuario: PapelUsuario;
      forma_pagamento: FormaPagamento;
      status_oportunidade_seguro: StatusOportunidadeSeguro;
      status_revisao: StatusRevisao;
      tipo_acompanhamento: TipoAcompanhamento;
      status_acompanhamento: StatusAcompanhamento;
    };
    Functions: {
      unidade_atual: {
        Args: Record<string, never>;
        Returns: string;
      };
      papel_atual: {
        Args: Record<string, never>;
        Returns: PapelUsuario;
      };
      ranking_mensal_unidade: {
        Args: Record<string, never>;
        Returns: {
          vendedor_id: string;
          vendedor_nome: string;
          total_vendido: number;
          quantidade_vendas: number;
          posicao: number;
        }[];
      };
    };
  };
}

export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Venda = Database["public"]["Tables"]["vendas"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfis"]["Row"];
