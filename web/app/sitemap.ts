// web/app/sitemap.ts
export default async function sitemap() {
  const base = "https://graneverest.com";
  return [
    { url: `${base}/`,        lastModified: new Date() },
    { url: `${base}/borrow`,  lastModified: new Date() },
  ];
}
