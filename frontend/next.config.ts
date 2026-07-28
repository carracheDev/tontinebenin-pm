import type { NextConfig } from "next";

// Servir l'app sous un sous-chemin (ex. /pm) quand NEXT_PUBLIC_BASE_PATH est défini
// au build. Vide en local → l'app reste à la racine.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
};

export default nextConfig;
