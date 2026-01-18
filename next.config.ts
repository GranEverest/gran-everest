import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ¡SIN REWRITES! Dejamos que app/api/proxy maneje todo.
};

export default nextConfig;