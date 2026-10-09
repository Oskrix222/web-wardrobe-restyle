// One place for what search engines and social networks read in <head>:
// absolute canonical URLs, Open Graph / Twitter cards and schema.org JSON-LD.
import { BUSINESS, CONTACT_PHONES, PRIMARY_PHONE } from "@/config/business";

/**
 * The site's public address. Canonical URLs, the sitemap and social cards must be
 * absolute, so this is set once in .env (VITE_SITE_URL) — change it there when the
 * custom domain goes live.
 */
export const SITE_URL = (
  (import.meta.env["VITE_SITE_URL"] as string | undefined) ||
  "https://oscare.kubowiczoskar.workers.dev"
).replace(/\/$/, "");

export const DEFAULT_OG_IMAGE = "/imgs/og-default.jpg";

/** Blog covers live in Supabase Storage — pages that show them open the connection early. */
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(import.meta.env["VITE_SUPABASE_URL"] as string).origin;
  } catch {
    return null;
  }
})();
export const storagePreconnect = SUPABASE_ORIGIN
  ? [{ rel: "preconnect", href: SUPABASE_ORIGIN, crossOrigin: "anonymous" as const }]
  : [];

/** "/blog" -> "https://…/blog"; absolute URLs pass through. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

type JsonLd = Record<string, unknown>;

export type SeoInput = {
  title: string;
  description: string;
  /** Path of the page, e.g. "/blog/abc" — becomes the canonical URL. */
  path: string;
  image?: string | null | undefined;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: JsonLd[];
  /** Extra meta tags, e.g. article:published_time. */
  meta?: { property?: string; name?: string; content: string }[];
};

/** Everything a route's head() needs: title, description, canonical, OG/Twitter, JSON-LD. */
export function seoHead({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd = [],
  meta = [],
}: SeoInput) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:site_name", content: BUSINESS.name },
      { property: "og:locale", content: "pl_PL" },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      ...meta,
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: jsonLd.map((data) => ({
      type: "application/ld+json",
      // "<" can't appear raw inside <script>, or a title like "</script>" would break out.
      children: JSON.stringify(data).replace(/</g, "\\u003c"),
    })),
  };
}

const ORG_ID = `${SITE_URL}/#organizacja`;

/** The agency itself — real address, phones and hours from src/config/business.ts. */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    "@id": ORG_ID,
    name: BUSINESS.name,
    url: `${SITE_URL}/`,
    logo: absoluteUrl("/imgs/logo.webp"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      "Agent ubezpieczeniowy z Jaworzna: ubezpieczenia na życie i zdrowie, mieszkania, turystyczne oraz grupowe dla firm. Spotkania w Jaworznie, Katowicach i online.",
    telephone: PRIMARY_PHONE.replace(/\s/g, ""),
    ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
    taxID: BUSINESS.nip,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: "PL",
    },
    areaServed: [
      ...BUSINESS.areaServed.map((name) => ({ "@type": "City", name })),
      { "@type": "AdministrativeArea", name: "województwo śląskie" },
    ],
    openingHours: BUSINESS.hours.map((h) => h.schema),
    employee: CONTACT_PHONES.map((c) => ({
      "@type": "Person",
      name: c.fullName,
      jobTitle: "Doradca ubezpieczeniowy",
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  updatedAt?: string | null | undefined;
}): JsonLd {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: post.title.slice(0, 110),
    ...(post.excerpt ? { description: post.excerpt } : {}),
    image: [absoluteUrl(post.coverImageUrl || DEFAULT_OG_IMAGE)],
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt || post.publishedAt || undefined,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@type": "Organization", name: BUSINESS.name },
    publisher: { "@id": ORG_ID, "@type": "InsuranceAgency", name: BUSINESS.name },
    inLanguage: "pl-PL",
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
