import { createServerFn } from "@tanstack/react-start";

import { parseTrustindexFeed, type GoogleReviewsFeed } from "./trustindex-feed";

export type { GoogleReview, GoogleReviewsFeed } from "./trustindex-feed";

/**
 * Google reviews for the "Sprawdź nas w Google" wall. Pulled from the free
 * Trustindex widget's published feed (Trustindex syncs it with Google), parsed
 * on the server and cached, so visitors never talk to Trustindex or Google.
 * Swap the source listing in the Trustindex panel — no code change needed.
 */

const WIDGET_ID = import.meta.env["VITE_TRUSTINDEX_WIDGET_ID"] as string | undefined;
const CACHE_MS = 60 * 60 * 1000; // per-isolate memo; the edge cache below lasts longer
const EDGE_CACHE_SECONDS = 6 * 60 * 60;

let memo: { at: number; feed: GoogleReviewsFeed } | null = null;

export const getGoogleReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<GoogleReviewsFeed> => {
    if (!WIDGET_ID) return { rating: null, reviews: [] };
    if (memo && Date.now() - memo.at < CACHE_MS) return memo.feed;

    const url = `https://cdn.trustindex.io/widgets/${WIDGET_ID.slice(0, 2)}/${WIDGET_ID}/content.html`;
    const onWorkers =
      typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
    const init = {
      signal: AbortSignal.timeout(6000),
      // Cloudflare edge cache: at most one Trustindex request per 6h per location.
      ...(onWorkers ? { cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true } } : {}),
    } as RequestInit;

    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Trustindex feed ${res.status}`);
    const feed = parseTrustindexFeed(await res.text());
    memo = { at: Date.now(), feed };
    return feed;
  },
);
