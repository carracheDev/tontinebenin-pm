import type { NextConfig } from "next";

// Sous-chemin optionnel (ex. /pm) — vide par défaut.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
// Backend interne : le front proxifie /api/* vers le backend NestJS (même origine).
const backend = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3100";

const nextConfig: NextConfig = {
  basePath,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
};

export default nextConfig;
