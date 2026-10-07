// =============================================================
// Google Business Profile behind the "Sprawdź nas w Google" block.
// To switch listings:
//  1. change placeId below (powers "Zobacz wszystkie opinie" / "Wystaw opinię"),
//  2. point the Trustindex widget at the new listing in admin.trustindex.io —
//     the review tiles follow automatically.
// =============================================================
export const GOOGLE_BUSINESS = {
  name: 'GARNITURY | KOSZULE - "Kusta"',
  placeId: "ChIJTVDj9-_CFkcRIN_hbA4t8xY",
} as const;

export const googleLinks = {
  /** All reviews of the listing on Google. */
  reviews: `https://search.google.com/local/reviews?placeid=${GOOGLE_BUSINESS.placeId}`,
  /** Opens Google's "write a review" dialog for the listing. */
  writeReview: `https://search.google.com/local/writereview?placeid=${GOOGLE_BUSINESS.placeId}`,
};
