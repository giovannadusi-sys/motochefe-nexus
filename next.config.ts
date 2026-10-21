import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão do Next.js é 1mb — pequeno demais para upload de PDF na
      // Base de Conhecimento (conhecimento/actions.ts).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
