"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

/**
 * Transição consistente entre telas.
 *
 * Navegação num dashboard interno é frequente ao longo do dia — por
 * isso a troca é rápida (~200ms) e roda em modo "sync" (entrada e saída
 * simultâneas), não "wait". Com "wait" a próxima tela só começa a
 * aparecer depois que a anterior termina de sair, o que soma as duas
 * durações e faz a navegação parecer travada. Em sync, a percepção de
 * velocidade é a de uma única transição.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(3px)" }}
        transition={{ type: "spring", duration: 0.28, bounce: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
