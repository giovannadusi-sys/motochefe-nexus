import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client administrativo do Supabase — usa a chave `service_role`, que
 * IGNORA toda Row Level Security. Existe só para operações que a Admin
 * API exige (hoje: criar usuário em `auth.users`, que não tem outra
 * forma de acontecer).
 *
 * REGRAS DE USO (sem exceção):
 * 1. Nunca importar este arquivo de um Client Component ou de qualquer
 *    código que rode no navegador — o `import "server-only"` acima faz
 *    o build FALHAR se isso acontecer, de propósito.
 * 2. Toda função que usa este client precisa checar a permissão do
 *    usuário chamador (via `createClient()` de `server.ts`, que respeita
 *    RLS/auth.uid()) ANTES de fazer qualquer operação privilegiada.
 *    Este client não sabe quem está "logado" — ele pode tudo.
 * 3. Nunca expor `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (ou a URL) não está configurada. Ver docs/SUPABASE_SETUP.md."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
