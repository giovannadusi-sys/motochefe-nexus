import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renovação de sessão do Supabase a cada request.
 *
 * Isto é infraestrutura, não lógica de autenticação: não há nenhum
 * redirecionamento de rota protegida aqui ainda (isso é uma decisão de
 * produto — quem pode ver o quê — que fica para quando o módulo de
 * usuários/permissões for implementado). O único trabalho desta função
 * é manter o cookie de sessão válido, para que quando o login existir
 * de fato, a sessão não "caia" sozinha.
 *
 * Chamada a partir de `src/proxy.ts` (convenção do Next.js 16,
 * sucessora do antigo `middleware.ts`).
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sem as variáveis de ambiente configuradas (ver docs/SUPABASE_SETUP.md),
  // deixa a request passar sem tentar renovar sessão — evita que o app
  // inteiro quebre com 500 antes mesmo do Supabase existir de verdade.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Necessário para o Supabase renovar o token quando expirado.
  // Não usar lógica entre createServerClient e getClaims().
  await supabase.auth.getClaims();

  return supabaseResponse;
}
