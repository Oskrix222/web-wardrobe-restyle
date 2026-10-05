import { createServerFn } from "@tanstack/react-start";

export type GoogleReview = {
  id: string;
  authorName: string;
  authorPhotoUrl: string | null;
  authorProfileUrl: string | null;
  rating: number;
  relativeTime: string;
  text: string;
};

export type GoogleReviewsResult = {
  businessName: string;
  mapsUrl: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
};

const PLACES_API = "https://places.googleapis.com/v1";
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{15,}$/;

/**
 * Google's share links (share.google/..., maps.app.goo.gl/...) redirect through
 * a search/maps URL that carries the business name in the path or `q` param —
 * we follow the redirect and pull that name out to use as a Places text search.
 */
async function resolveSearchTextFromLink(link: string): Promise<string> {
  const response = await fetch(link, { redirect: "follow" });
  const finalUrl = response.url;

  const placePath = finalUrl.match(/\/maps\/place\/([^/@]+)/);
  if (placePath?.[1]) {
    return decodeURIComponent(placePath[1].replace(/\+/g, " "));
  }

  const q = new URL(finalUrl).searchParams.get("q");
  if (q) return q;

  const html = await response.text();
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (ogTitle?.[1]) return ogTitle[1];

  throw new Error(`Nie udało się rozpoznać firmy z linku: ${link}`);
}

async function resolvePlaceId(apiKey: string, source: string): Promise<string> {
  if (!source.startsWith("http") && PLACE_ID_PATTERN.test(source)) {
    return source;
  }

  const searchText = source.startsWith("http") ? await resolveSearchTextFromLink(source) : source;

  const res = await fetch(`${PLACES_API}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({ textQuery: searchText }),
  });

  if (!res.ok) {
    throw new Error(`Google Places: wyszukiwanie firmy nie powiodło się (${res.status}).`);
  }

  const data = (await res.json()) as {
    places?: { id: string; displayName?: { text: string } }[];
  };

  const place = data.places?.[0];
  if (!place) {
    throw new Error(`Nie znaleziono firmy w Google dla zapytania: "${searchText}".`);
  }

  return place.id;
}

type PlaceDetailsResponse = {
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: {
    name: string;
    relativePublishTimeDescription?: string;
    rating?: number;
    text?: { text: string };
    authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
  }[];
};

/**
 * Fetches live Google reviews for the business configured via
 * GOOGLE_REVIEWS_SOURCE (a place_id, a Google Maps share link, or a plain
 * business name) using GOOGLE_PLACES_API_KEY. Swap the business by changing
 * GOOGLE_REVIEWS_SOURCE — no code changes needed.
 */
export const getGoogleReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<GoogleReviewsResult> => {
    const apiKey = process.env["GOOGLE_PLACES_API_KEY"];
    const source = process.env["GOOGLE_REVIEWS_SOURCE"];

    if (!apiKey || !source) {
      throw new Error(
        "Brak konfiguracji Google Reviews — ustaw GOOGLE_PLACES_API_KEY i GOOGLE_REVIEWS_SOURCE w .env.",
      );
    }

    const placeId = await resolvePlaceId(apiKey, source);

    const detailsRes = await fetch(`${PLACES_API}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,googleMapsUri,reviews",
      },
    });

    if (!detailsRes.ok) {
      throw new Error(`Google Places: pobranie opinii nie powiodło się (${detailsRes.status}).`);
    }

    const details = (await detailsRes.json()) as PlaceDetailsResponse;

    return {
      businessName: details.displayName?.text ?? "",
      mapsUrl: details.googleMapsUri ?? "",
      rating: details.rating ?? 0,
      totalReviews: details.userRatingCount ?? 0,
      reviews: (details.reviews ?? []).map((review) => ({
        id: review.name,
        authorName: review.authorAttribution?.displayName ?? "Klient Google",
        authorPhotoUrl: review.authorAttribution?.photoUri ?? null,
        authorProfileUrl: review.authorAttribution?.uri ?? null,
        rating: review.rating ?? 5,
        relativeTime: review.relativePublishTimeDescription ?? "",
        text: review.text?.text ?? "",
      })),
    };
  },
);
