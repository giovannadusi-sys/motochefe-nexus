import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Client do Supabase para uso no servidor (Server Components, Server
 * Actions, Route Handlers). Lê/escreve a sessão via cookies do Next.js.
 *
 * Uso (dentro de uma função async, sem "use client"):
 *   const supabase = await createClient();
 *   const { data } = await supabase.from("clientes").select();
 *
 * Nota: em Server Components (não em Server Actions/Route Handlers), a
 * escrita de cookies pode ser ignorada silenciosamente — é esperado,
 * porque o Next.js não permite setar cookies durante a renderização.
 * O middleware (ver middleware.ts) é quem garante que a sessão continua
 * sendo renovada nesses casos.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — ignorado de
            // propósito. O middleware cuida da renovação da sessão.
          }
        },
      },
    }
  );
}
