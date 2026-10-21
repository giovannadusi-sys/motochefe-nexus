"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "motochefe-theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

/**
 * Tema claro/escuro/automático, com persistência em localStorage.
 *
 * O "flash" de tema errado no primeiro paint é evitado por um script
 * inline no <head> (ver root layout) que aplica a classe `.dark` antes
 * mesmo do React hidratar — este provider só assume esse estado depois,
 * sem precisar duplicar a lógica de decisão nem causar um segundo
 * "pulo" visual.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light");

  // Efeito intencional: sincroniza com localStorage (sistema externo),
  // que não existe durante o SSR. Uma inicialização "preguiçosa" do
  // useState aqui pareceria mais idiomática, mas causaria divergência
  // entre o HTML do servidor e o do cliente (localStorage não existe
  // no servidor) — o efeito é a forma correta, mesmo que o lint padrão
  // sinalize qualquer setState direto num efeito.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setThemeState(stored);
    setResolvedTheme(stored === "system" ? getSystemTheme() : stored);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function onChange() {
      const resolved = mql.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const resolved = next === "system" ? getSystemTheme() : next;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  return ctx;
}
