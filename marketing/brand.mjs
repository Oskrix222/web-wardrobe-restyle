// =============================================================
// Brand settings for the social-media package generator
// (instructions: marketing/JAK-UZYWAC.md). Colours and fonts come
// straight from the website (src/styles/_brandbook.scss, public/fonts).
// =============================================================
export default {
  name: "OSCare Ubezpieczenia",
  /** Blog links and UTM tracking point here — switch to the own domain once it's attached. */
  site: "https://oscare.kubowiczoskar.workers.dev",
  phone: "+48 539 075 385",
  /** e.g. "@oscare.ubezpieczenia" — shown in captions when set. */
  instagram: "",
  /** e.g. "Warszawa" — local hashtags and local SEO phrases when set. */
  city: "Jaworzno",
  /** Byline for blog posts (a real person ranks better than a brand). */
  author: "Oskar Kubowicz",
  brandHashtag: "#OSCare",
  /** Legal footnote: CTA slide and blog posts. */
  disclosure:
    "Materiał marketingowy. Zakres ochrony, limity i wyłączenia określają ogólne warunki ubezpieczenia (OWU) wybranego ubezpieczyciela.",
  /**
   * Weekly rhythm in the panel's calendar (day: 1 = Monday … 7 = Sunday, Polish time).
   * One package fills one week: blog first, then 3 reels around one feed post.
   */
  schedule: {
    blog: { day: 1, time: "07:00" },
    reels: [
      { day: 2, time: "19:00" },
      { day: 4, time: "19:00" },
      { day: 6, time: "10:00" },
    ],
    post: { day: 3, time: "18:00" },
    story: { day: 3, time: "20:00" },
  },
};
