// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
  
//   // Configuração para o servidor de desenvolvimento
//   webpack: (config) => {
//     // Configuração para resolver problemas com MongoDB no ambiente de desenvolvimento
//     return {
//       ...config,
//       experiments: {
//         topLevelAwait: true,
//       },
//     }
//   },
// };

// export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuração para o servidor de desenvolvimento
  webpack: (config) => {
    // Configuração para resolver problemas com MongoDB no ambiente de desenvolvimento
    return {
      ...config,
      experiments: {
        ...config.experiments, // Mantém experimentos que já estão configurados pelo Next.js
        topLevelAwait: true,
        layers: true, // Adiciona suporte para layers, resolvendo o erro
      },
    }
  },
  // Adiciona configuração do ESLint para ignorar erros durante builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;