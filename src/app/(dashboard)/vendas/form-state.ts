import type { FormaPagamento } from "@/types/database";

export interface VendaAtualizada {
  id: string;
  cliente_id: string;
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
}

export interface VendaFormState {
  error: string | null;
  success: boolean;
  venda?: VendaAtualizada;
}

export const initialVendaFormState: VendaFormState = {
  error: null,
  success: false,
};
