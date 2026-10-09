import { LOCATIONS } from "@/config/locations";
import { SITE_URL } from "@/lib/seo";

// /sitemap.xml — every page Google should index, with the blog posts' last edit
// dates. Linked from robots.txt; submit it once in Google Search Console.
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  ...LOCATIONS.map((l) => ({ path: l.path, priority: "0.9", changefreq: "monthly" })),
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
];

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildSitemap(
  posts: { slug: string; updated_at: string | null; published_at: string | null }[],
): string {
  const entry = (path: string, extra: string) =>
    `  <url>\n    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n${extra}  </url>\n`;
  const pages = STATIC_PAGES.map((page) =>
    entry(
      page.path,
      `    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n`,
    ),
  );
  const articles = posts.map((post) => {
    const modified = post.updated_at ?? post.published_at;
    return entry(
      `/blog/${encodeURIComponent(post.slug)}`,
      `${modified ? `    <lastmod>${modified.slice(0, 10)}</lastmod>\n` : ""}    <priority>0.7</priority>\n`,
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...pages, ...articles].join("")}</urlset>\n`;
}

// /robots.txt — built from VITE_SITE_URL so the sitemap link follows a domain change.
export const ROBOTS_TXT = `# ${SITE_URL}
# The admin panel and internal endpoints are not for search engines.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /_serverFn/
Disallow: /najnowszy

Sitemap: ${SITE_URL}/sitemap.xml
`;
