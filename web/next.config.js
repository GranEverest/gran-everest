// web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // genera ./out
  images: { unoptimized: true },
  trailingSlash: false,      // /borrow → /borrow/index.html
};
module.exports = nextConfig;
