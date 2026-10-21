export interface ClienteFormState {
  error: string | null;
  success: boolean;
}

export const initialClienteFormState: ClienteFormState = {
  error: null,
  success: false,
};
