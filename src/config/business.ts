// =============================================================
// Google Business Profile shown in the "Opinie i lokalizacja" block.
// To switch to another listing, change these values only:
//  - mapsQuery: the listing's exact name + address, as Google Maps shows it
//  - placeId:   "ChIJ…" id of the listing (powers the review links)
// =============================================================
export const GOOGLE_BUSINESS = {
  name: 'GARNITURY | KOSZULE - "Kusta"',
  address: "Ignacego Paderewskiego 16, 43-600 Jaworzno",
  mapsQuery: 'GARNITURY | KOSZULE - "Kusta", Ignacego Paderewskiego 16, 43-600 Jaworzno',
  placeId: "ChIJTVDj9-_CFkcRIN_hbA4t8xY",
} as const;

export const googleLinks = {
  /** Interactive map embed (no API key needed). */
  mapEmbed: `https://www.google.com/maps?q=${encodeURIComponent(GOOGLE_BUSINESS.mapsQuery)}&hl=pl&z=15&output=embed`,
  /** All reviews of the listing on Google. */
  reviews: `https://search.google.com/local/reviews?placeid=${GOOGLE_BUSINESS.placeId}`,
  /** Opens Google's "write a review" dialog for the listing. */
  writeReview: `https://search.google.com/local/writereview?placeid=${GOOGLE_BUSINESS.placeId}`,
  /** Directions / full listing in Google Maps. */
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(GOOGLE_BUSINESS.mapsQuery)}&query_place_id=${GOOGLE_BUSINESS.placeId}`,
};
