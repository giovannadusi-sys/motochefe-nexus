/**
 * Checa se a chave da API do Google (Gemini) foi configurada (ver
 * docs/ASSISTENTE_IA_SETUP.md). Mesmo padrão do
 * `isSupabaseConfigured()` — mostra uma tela amigável em vez de
 * quebrar a página com erro cru.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
