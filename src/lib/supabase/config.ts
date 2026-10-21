/**
 * Checa se as variáveis de ambiente do Supabase foram preenchidas
 * (ver docs/SUPABASE_SETUP.md). Usado para mostrar uma tela amigável
 * em vez de deixar o app quebrar com 500 antes da configuração.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
