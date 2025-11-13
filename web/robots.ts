// web/app/robots.ts
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin"] },
    ],
    sitemap: "https://graneverest.com/sitemap.xml",
    host: "https://graneverest.com",
  };
}
