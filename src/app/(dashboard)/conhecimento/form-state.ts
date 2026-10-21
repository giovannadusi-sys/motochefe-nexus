export interface ArtigoFormState {
  error: string | null;
  success: boolean;
}

export const initialArtigoFormState: ArtigoFormState = {
  error: null,
  success: false,
};
