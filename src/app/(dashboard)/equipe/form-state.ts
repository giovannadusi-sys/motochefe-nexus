export interface CriarUsuarioState {
  error: string | null;
  sucesso: { email: string; senha: string; nome: string } | null;
}

export const initialCriarUsuarioState: CriarUsuarioState = {
  error: null,
  sucesso: null,
};

export interface AtualizarUsuarioState {
  error: string | null;
  success: boolean;
}

export const initialAtualizarUsuarioState: AtualizarUsuarioState = {
  error: null,
  success: false,
};
