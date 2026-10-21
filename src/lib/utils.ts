import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes Tailwind com segurança, resolvendo conflitos
 * (ex: "p-2 p-4" -> "p-4"). Usado em todos os componentes de UI.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
