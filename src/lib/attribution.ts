// Where a lead came from: the first page of the visit with its utm_* tags (links in
// Instagram/Facebook comments carry them), the referring site and the last blog post
// read. Kept in memory only — nothing is stored on the device, so no cookie consent is
// needed; a full page reload simply starts a new visit.

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "landing",
  "referrer",
  "post",
  "page",
] as const;

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

let firstTouch: Attribution | null = null;
let lastPost: string | null = null;

const clip = (value: string) => value.slice(0, 200);

/** Called once when the site loads in the browser. */
export function captureAttribution(href: string, referrer: string) {
  if (firstTouch) return;
  const url = new URL(href);
  const touch: Attribution = { landing: clip(url.pathname) };
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ] as const) {
    const value = url.searchParams.get(key);
    if (value) touch[key] = clip(value);
  }
  try {
    const from = new URL(referrer);
    // Only other sites matter; moving around our own pages isn't a source.
    if (from.host !== url.host) touch.referrer = clip(from.host);
  } catch {
    // No referrer (typed address, app, bookmark).
  }
  firstTouch = touch;
}

/** The blog post page reports itself, so a lead can be tied to the article that convinced. */
export function notePostRead(slug: string) {
  lastPost = clip(slug);
}

/** What goes with the form: the visit's first touch + the page the form was sent from. */
export function currentAttribution(): Attribution {
  const result: Attribution = { ...firstTouch };
  if (lastPost) result.post = lastPost;
  if (typeof window !== "undefined") result.page = clip(window.location.pathname);
  return result;
}

/** "instagram / post-comment · blog: rak-i-polisa" for the admin's lead list. */
export function describeSource(source: Attribution | null | undefined): string | null {
  if (!source) return null;
  const parts: string[] = [];
  const channel = [source.utm_source, source.utm_content || source.utm_medium]
    .filter(Boolean)
    .join(" / ");
  if (channel) parts.push(channel);
  else if (source.referrer) parts.push(source.referrer);
  else if (source.landing) parts.push("wejście bezpośrednie");
  if (source.post) parts.push(`blog: ${source.post}`);
  if (source.page && source.page !== "/" && !source.post) parts.push(`strona: ${source.page}`);
  return parts.length ? parts.join(" · ") : null;
}
