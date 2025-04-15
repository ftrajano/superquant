import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Configuração para o servidor de desenvolvimento
  webpack: (config) => {
    // Configuração para resolver problemas com MongoDB no ambiente de desenvolvimento
    return {
      ...config,
      experiments: {
        topLevelAwait: true,
      },
    }
  },
};

export default nextConfig;
