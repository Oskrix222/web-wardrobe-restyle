// Turns the Trustindex widget's published HTML into plain review data.
// Kept free of server/runtime imports so it can be unit-tested on its own.

export type GoogleReview = {
  id: string;
  name: string;
  rating: number;
  /** ISO date the review was posted. */
  postedAt: string;
  text: string;
};

export type GoogleReviewsFeed = {
  rating: number | null;
  reviews: GoogleReview[];
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function cleanText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function parseTrustindexFeed(html: string): GoogleReviewsFeed {
  const ratingMatch = html.match(/class="ti-header-rating">([\d.,]+)</);
  const rating = ratingMatch ? Number(ratingMatch[1]!.replace(",", ".")) : null;

  const reviews: GoogleReview[] = [];
  for (const block of html.split('<div class="ti-review-item').slice(1)) {
    const id = block.match(/data-id="([^"]+)"/)?.[1];
    const time = Number(block.match(/data-time="(\d+)"/)?.[1]);
    const stars = Number(block.match(/data-rating="([\d.]+)"/)?.[1]);
    const name = block.match(/<div class="ti-name">([\s\S]*?)<\/div>/)?.[1];
    const text = block.match(/<!-- R-CONTENT -->([\s\S]*?)<!-- R-CONTENT -->/)?.[1];
    if (!id || !name || !time || !text) continue; // rating-only reviews have no text
    const cleaned = cleanText(text);
    if (!cleaned) continue;
    reviews.push({
      id,
      name: decodeEntities(name.trim()),
      rating: Number.isFinite(stars) ? stars : 5,
      postedAt: new Date(time * 1000).toISOString(),
      text: cleaned,
    });
  }

  reviews.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return { rating: rating && Number.isFinite(rating) ? rating : null, reviews };
}
