// Public site: SEO head tags, structured data, sitemap/robots, security headers,
// lead attribution and the contact form's validation.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.VITE_SITE_URL = "https://oscare.example/";
process.env.VITE_SUPABASE_URL = "https://abc.supabase.co";

const seo = await import("@/lib/seo");
const { buildSitemap, ROBOTS_TXT } = await import("@/lib/sitemap");
const { withSecurityHeaders } = await import("@/lib/security-headers");
const attribution = await import("@/lib/attribution");
const { leadSchema } = await import("@/lib/leads.functions");
const { LOCATIONS } = await import("@/config/locations");
const { BUSINESS, CONTACT_PHONES, GOOGLE_BUSINESS } = await import("@/config/business");

const metaContent = (head, key) =>
  head.meta.find((m) => m.name === key || m.property === key)?.content;

test("every page gets an absolute canonical URL and a social card with an image", () => {
  const head = seo.seoHead({ title: "T", description: "D", path: "/blog/abc" });
  assert.equal(head.links[0].href, "https://oscare.example/blog/abc");
  assert.equal(metaContent(head, "og:url"), "https://oscare.example/blog/abc");
  assert.equal(metaContent(head, "og:image"), "https://oscare.example/imgs/og-default.jpg");
  assert.equal(metaContent(head, "twitter:card"), "summary_large_image");
  assert.equal(metaContent(head, "robots"), undefined, "indexable by default");

  const legal = seo.seoHead({ title: "T", description: "D", path: "/x", noindex: true });
  assert.equal(metaContent(legal, "robots"), "noindex, follow");

  const withCover = seo.seoHead({
    title: "T",
    description: "D",
    path: "/x",
    image: "https://abc.supabase.co/storage/v1/object/public/blog-images/a.webp",
  });
  assert.match(metaContent(withCover, "og:image"), /^https:\/\/abc\.supabase\.co\//);
});

test("JSON-LD can't break out of its <script> tag", () => {
  const head = seo.seoHead({
    title: "T",
    description: "D",
    path: "/",
    jsonLd: [{ headline: "</script><script>alert(1)</script>" }],
  });
  const json = head.scripts[0].children;
  assert.ok(!json.includes("</script>"));
  assert.equal(JSON.parse(json).headline, "</script><script>alert(1)</script>");
});

test("the agency's structured data uses the real address and phones, no placeholders", () => {
  const org = seo.organizationJsonLd();
  const text = JSON.stringify(org);
  assert.equal(org["@type"], "InsuranceAgency");
  assert.equal(org.address.streetAddress, BUSINESS.street);
  assert.equal(org.address.addressLocality, "Jaworzno");
  assert.equal(org.telephone, CONTACT_PHONES[0].phone.replace(/\s/g, ""));
  for (const placeholder of ["Przykładowa", "kamien.pl", "00-000", "Warszawa", "123 846"]) {
    assert.ok(!text.includes(placeholder), `no "${placeholder}" in structured data`);
  }
  assert.deepEqual(
    org.areaServed.slice(0, 2).map((a) => a.name),
    ["Jaworzno", "Katowice"],
  );
});

test("blog posts get BlogPosting + breadcrumb data with absolute URLs", () => {
  const article = seo.articleJsonLd({
    slug: "jak-wybrac",
    title: "Jakie ubezpieczenie na życie wybrać?",
    excerpt: "Opis",
    coverImageUrl: null,
    author: "Oskar Kubowicz",
    publishedAt: "2026-10-01T07:00:00Z",
    updatedAt: "2026-10-02T07:00:00Z",
  });
  assert.equal(article["@type"], "BlogPosting");
  assert.equal(article.url, "https://oscare.example/blog/jak-wybrac");
  assert.equal(article.dateModified, "2026-10-02T07:00:00Z");
  assert.equal(article.author.name, "Oskar Kubowicz");
  assert.deepEqual(article.image, ["https://oscare.example/imgs/og-default.jpg"]);

  const crumbs = seo.breadcrumbJsonLd([
    { name: "Strona główna", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);
  assert.equal(crumbs.itemListElement[1].position, 2);
  assert.equal(crumbs.itemListElement[1].item, "https://oscare.example/blog");
});

test("sitemap lists the home page, both city pages, the blog and every post", () => {
  const xml = buildSitemap([
    { slug: "jak-wybrac", updated_at: "2026-10-02T07:00:00Z", published_at: "2026-10-01" },
    { slug: "a&b", updated_at: null, published_at: null },
  ]);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  for (const path of ["/", "/ubezpieczenia-jaworzno", "/ubezpieczenia-katowice", "/blog"]) {
    assert.ok(xml.includes(`<loc>https://oscare.example${path}</loc>`), path);
  }
  assert.ok(xml.includes("<loc>https://oscare.example/blog/jak-wybrac</loc>"));
  assert.ok(xml.includes("<lastmod>2026-10-02</lastmod>"));
  assert.ok(xml.includes("/blog/a%26b"), "slugs are URL-encoded");
  assert.ok(!xml.includes("polityka-prywatnosci"), "noindex pages stay out");
  assert.ok(!xml.includes("/admin"));
});

test("robots.txt points to the sitemap and keeps the panel out of Google", () => {
  assert.match(ROBOTS_TXT, /^Sitemap: https:\/\/oscare\.example\/sitemap\.xml$/m);
  assert.match(ROBOTS_TXT, /^Disallow: \/admin$/m);
  assert.match(ROBOTS_TXT, /^Disallow: \/api\/$/m);
});

test("security headers are added to every response, also to immutable redirects", async () => {
  const page = withSecurityHeaders(
    new Response("<html></html>", { headers: { "content-type": "text/html" } }),
  );
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(page.headers.get("strict-transport-security"), /max-age=31536000/);
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("content-type"), "text/html");
  assert.equal(await page.text(), "<html></html>");

  const redirect = withSecurityHeaders(Response.redirect("https://oscare.example/blog", 302));
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get("location"), "https://oscare.example/blog");
  assert.equal(redirect.headers.get("x-frame-options"), "DENY");
});

test("attribution keeps the campaign tags of the first page and the post that was read", () => {
  attribution.captureAttribution(
    "https://oscare.example/blog/rak?utm_source=instagram&utm_medium=social&utm_content=post-comment",
    "https://l.instagram.com/",
  );
  // A later page view in the same visit doesn't overwrite the first touch.
  attribution.captureAttribution("https://oscare.example/?utm_source=google", "");
  attribution.notePostRead("rak");
  const source = attribution.currentAttribution();
  assert.equal(source.utm_source, "instagram");
  assert.equal(source.utm_content, "post-comment");
  assert.equal(source.landing, "/blog/rak");
  assert.equal(source.referrer, "l.instagram.com");
  assert.equal(source.post, "rak");
  assert.equal(attribution.describeSource(source), "instagram / post-comment · blog: rak");
  assert.equal(attribution.describeSource({ landing: "/" }), "wejście bezpośrednie");
  assert.equal(attribution.describeSource(null), null);
});

test("the contact form accepts a normal enquiry and rejects junk", () => {
  const valid = {
    name: "Jan Kowalski",
    phone: "+48 539 075 385",
    email: "",
    insuranceType: "life",
    message: "Proszę o kontakt po 17.",
    consent: true,
    website: "",
    source: { utm_source: "instagram", post: "rak" },
  };
  assert.equal(leadSchema.safeParse(valid).success, true);
  assert.equal(leadSchema.safeParse({ ...valid, phone: "539.075.385" }).success, true);

  const rejects = {
    "unknown insurance type": { insuranceType: "car" },
    "link in the name": { name: "Buy now https://spam.example" },
    "letters in the phone": { phone: "call me maybe" },
    "too few digits": { phone: "12-34-56-7" },
    "broken e-mail": { email: "jan@" },
    "no consent": { consent: false },
    "huge message": { message: "x".repeat(1001) },
    "unknown source key": { source: { evil: "x" } },
    "oversized source value": { source: { utm_source: "x".repeat(201) } },
  };
  for (const [label, patch] of Object.entries(rejects)) {
    assert.equal(leadSchema.safeParse({ ...valid, ...patch }).success, false, label);
  }
});

test("city pages have their own text, real districts and no car insurance", () => {
  assert.equal(LOCATIONS.length, 2);
  const [jaworzno, katowice] = LOCATIONS;
  assert.notEqual(jaworzno.lead, katowice.lead);
  assert.notEqual(jaworzno.meeting, katowice.meeting);
  assert.ok(jaworzno.districts.includes("Szczakowa"));
  assert.ok(katowice.districts.includes("Ligota"));
  for (const location of LOCATIONS) {
    assert.ok(location.title.length <= 60, `${location.slug} title ≤ 60 chars`);
    assert.ok(location.description.length <= 160, `${location.slug} description ≤ 160 chars`);
    const text = JSON.stringify(location).toLowerCase();
    assert.ok(!/\boc\/ac\b|samoch/.test(text), `${location.slug}: no car insurance (truths)`);
  }
  // Katowice has no office — the page must not claim one.
  assert.ok(!/biuro przy|naszym biurze/i.test(katowice.meeting));
});

test("reviews of the placeholder Google listing stay hidden", () => {
  assert.equal(GOOGLE_BUSINESS.live, false);
});
