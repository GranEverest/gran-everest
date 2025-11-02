/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático para Hostinger (sin runtime Node)
  output: 'export',
  trailingSlash: true,           // genera /borrow/ como carpeta
  images: { unoptimized: true }, // desactiva optimizador de imágenes
  reactStrictMode: true,

  // Opcional: NEXT_PUBLIC_* ya se expone solo; lo dejo para claridad
  env: {
    NEXT_PUBLIC_CHAIN: process.env.NEXT_PUBLIC_CHAIN,
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS,
  },
};

export default nextConfig;
