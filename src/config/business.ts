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

// =============================================================
// Phone numbers shown next to the contact buttons on the blog
// (middle and end of every post). Izumi's number is a test value.
// =============================================================
export const CONTACT_PHONES = [
  { name: "Oskar", phone: "+48 539 075 385" },
  { name: "Izumi", phone: "+48 123 456 789" },
] as const;

/** "+48 539 075 385" -> "tel:+48539075385" */
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;
