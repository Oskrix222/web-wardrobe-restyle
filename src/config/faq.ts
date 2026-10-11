// =============================================================
// FAQ on the home page ("Najczęstsze pytania"). Answers come from Oskar —
// add a question here and it shows up on the page and in Google's
// structured data (FAQPage) at the same time.
// =============================================================

export type FaqItem = { question: string; answer: string };

export const FAQ: FaqItem[] = [
  {
    question: "Ile zajmuje cały proces zakupu ubezpieczenia?",
    answer:
      "Najczęściej mieścimy się w 45 minutach — w pełni zdalnie, na spotkaniu w Microsoft Teams.",
  },
];
