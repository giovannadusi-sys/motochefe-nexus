import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Client do Supabase para uso em Client Components (código que roda no
 * navegador). Usa a chave "anon" — pública por definição, protegida pelas
 * Row Level Security policies do banco (supabase/migrations/*_rls.sql).
 *
 * Uso:
 *   "use client";
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
