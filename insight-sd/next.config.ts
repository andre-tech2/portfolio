import type { NextConfig } from "next";

// Vazio em dev (roda em localhost:3000/); setado pelo CI pra publicar em /portfolio/insight-sd/ no GitHub Pages.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // App 100% client-side (sem rotas de servidor) — exporta como site estático.
  output: "export",
  // Export estático não tem a API de otimização de imagem do Next (precisa de servidor).
  images: { unoptimized: true },
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH ? `${BASE_PATH}/` : undefined,
  trailingSlash: true,
};

export default nextConfig;
