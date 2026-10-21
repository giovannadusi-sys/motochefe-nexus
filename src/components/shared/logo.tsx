import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** "mark" = só o emblema (M/C + moto), pro slot compacto do menu.
   *  "full" = logo completa com o wordmark "MOTO CHEFE". */
  variant?: "full" | "mark";
  className?: string;
}

/**
 * Logo oficial da Motochefe. O arquivo original tinha fundo branco
 * sólido — processado (remoção de fundo) para ficar transparente e
 * funcionar bem tanto no tema claro quanto no escuro.
 */
export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo-motochefe-mark.png"
        alt="Motochefe"
        width={64}
        height={32}
        className={cn("h-auto w-full object-contain dark:invert", className)}
        priority
      />
    );
  }

  return (
    <Image
      src="/logo-motochefe.png"
      alt="Motochefe"
      width={200}
      height={200}
      className={cn("h-auto w-32 object-contain dark:invert", className)}
      priority
    />
  );
}
