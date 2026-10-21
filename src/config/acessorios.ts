export interface AcessorioCatalogo {
  id: string;
  nome: string;
  valor: number;
}

/** Acessórios vendidos à parte do veículo (valor não soma em vendas.valor). */
export const ACESSORIOS_DISPONIVEIS: AcessorioCatalogo[] = [
  { id: "capacete", nome: "Capacete", valor: 250 },
  { id: "capa_chuva", nome: "Capa de chuva", valor: 400 },
  { id: "cadeirinha", nome: "Cadeirinha", valor: 680 },
  { id: "bau", nome: "Baú", valor: 680 },
];
