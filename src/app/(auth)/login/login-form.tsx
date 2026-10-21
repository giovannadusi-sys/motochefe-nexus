"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

/**
 * Formulário de login real, via Supabase Auth (e-mail/senha).
 *
 * Estado de progresso: o `Button` já mostra spinner (`isLoading`)
 * durante o `useActionState` pendente. O erro entra/sai com uma
 * transição curta em vez de "pular" no layout.
 */
export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input
        type="email"
        name="email"
        placeholder="E-mail"
        autoComplete="email"
        required
      />
      <Input
        type="password"
        name="password"
        placeholder="Senha"
        autoComplete="current-password"
        required
      />

      <AnimatePresence>
        {state.error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.65, 0, 0.35, 1] }}
            className="overflow-hidden text-sm text-danger"
          >
            {state.error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" isLoading={isPending} className="mt-1 w-full">
        Entrar
      </Button>
    </form>
  );
}
