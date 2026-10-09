// =============================================================
// Everything about the business that the site shows in more than one
// place: phones, address, hours, stats. Change it here and the page,
// footer, privacy policy, location pages and Google's structured data
// (JSON-LD) all follow.
// =============================================================

export const BUSINESS = {
  name: "OSCare Ubezpieczenia",
  street: "ul. Starowiejska 43",
  postalCode: "43-603",
  city: "Jaworzno",
  region: "śląskie",
  nip: "6322037383",
  agentNumber: "11115498/A",
  /** Opening hours as shown in the footer, and in schema.org format for Google. */
  hours: [
    { label: "Pon–Pt", time: "9:00–20:00", schema: "Mo-Fr 09:00-20:00" },
    { label: "Sob", time: "10:00–14:00", schema: "Sa 10:00-14:00" },
  ],
  /** Cities with their own landing page (/ubezpieczenia-<slug>). */
  areaServed: ["Jaworzno", "Katowice"],
  /**
   * Public contact e-mail. null hides it everywhere (the old kontakt@kamien.pl
   * belonged to someone else's domain). Put the real address here when it exists.
   */
  email: null as string | null,
} as const;

// =============================================================
// Phone numbers. The first one is the main number on the page's call
// buttons; the blog and the "after sending" panel list all of them.
// Izumi's number is a test value until the real one is known.
// =============================================================
export const CONTACT_PHONES = [
  { name: "Oskar", fullName: "Oskar Kubowicz", phone: "+48 539 075 385" },
  { name: "Izumi", fullName: "Izumi Sato", phone: "+48 123 456 789" },
] as const;

export const PRIMARY_PHONE = CONTACT_PHONES[0].phone;

/** "+48 539 075 385" -> "tel:+48539075385" */
export const telHref = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

// =============================================================
// Numbers shown in the hero and next to the contact form.
// The hero used to say "+25" while the tiles said "+150" — keep one value.
// =============================================================
export const STATS = {
  clients: "+150",
  payouts: "+78",
  sinceYear: "2005",
} as const;

// =============================================================
// Google Business Profile behind the "Sprawdź nas w Google" block.
// `live: false` hides the rating and the reviews: until OSCare has its own
// listing, the placeholder below points at an unrelated shop ("Kusta") and
// its reviews must not be shown as ours. To switch it on:
//  1. put OSCare's placeId below and set live: true,
//  2. point the Trustindex widget at the new listing in admin.trustindex.io.
// =============================================================
export const GOOGLE_BUSINESS = {
  live: false,
  name: 'GARNITURY | KOSZULE - "Kusta"',
  placeId: "ChIJTVDj9-_CFkcRIN_hbA4t8xY",
} as const;

export const googleLinks = {
  /** All reviews of the listing on Google. */
  reviews: `https://search.google.com/local/reviews?placeid=${GOOGLE_BUSINESS.placeId}`,
  /** Opens Google's "write a review" dialog for the listing. */
  writeReview: `https://search.google.com/local/writereview?placeid=${GOOGLE_BUSINESS.placeId}`,
};
