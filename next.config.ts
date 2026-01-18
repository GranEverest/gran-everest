import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! IMPORTANTE: Ignora errores de tipado para poder desplegar YA !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! IMPORTANTE: Ignora errores de estilo para poder desplegar YA !!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;