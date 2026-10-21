import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motochefe Nexus",
  description: "Plataforma interna de gestão comercial — Motochefe Piratininga",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

// Aplica a classe de tema ANTES do React hidratar, lendo direto do
// localStorage — sem isso, a tela pisca no tema errado por uma fração
// de segundo a cada carregamento (efeito clássico de FOUC). É uma
// string fixa controlada por nós, não input do usuário — seguro usar
// dangerouslySetInnerHTML aqui.
//
// Usa `next/script` com `strategy="beforeInteractive"` em vez de uma
// tag <script> crua: a partir do React 19, uma <script> normal dentro
// da árvore de componentes não é garantida rodar no client render —
// o próprio React avisa "Scripts inside React components are never
// executed when rendering on the client". `next/script` é o mecanismo
// suportado pelo Next.js para injetar um script que precisa rodar
// antes da hidratação.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('motochefe-theme') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
