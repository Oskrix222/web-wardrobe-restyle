// Local landing pages (/ubezpieczenia-jaworzno, /ubezpieczenia-katowice).
// Each one targets "<product> <city>" searches — e.g. "ubezpieczenia jaworzno",
// "agent ubezpieczeniowy katowice", "ubezpieczenie na życie katowice" (all real
// Google autocomplete queries, see marketing/SEO-FRAZY.md). Every page needs its
// own, genuinely local text: near-identical city pages count as spam for Google.
//
// Only state facts that are true. Katowice has no office (yet) — so we meet the
// client at home, at their company, or online.

export type LocationFaq = { question: string; answer: string };

export type Location = {
  slug: "jaworzno" | "katowice";
  path: "/ubezpieczenia-jaworzno" | "/ubezpieczenia-katowice";
  city: string;
  /** "w Jaworznie" / "w Katowicach" */
  inCity: string;
  title: string;
  description: string;
  heading: string;
  lead: string;
  /** How a meeting works in this city. */
  meeting: string;
  districts: string[];
  nearby: string[];
  faq: LocationFaq[];
};

const sharedFaq: LocationFaq[] = [
  {
    question: "Ile kosztuje rozmowa i przygotowanie oferty?",
    answer:
      "Nic. Rozmowa, analiza Twojej sytuacji i porównanie wariantów są bezpłatne i do niczego nie zobowiązują. Płacisz dopiero składkę za polisę, jeśli zdecydujesz się ją podpisać.",
  },
  {
    question: "Ile kosztuje ubezpieczenie na życie?",
    answer:
      "Składka zależy przede wszystkim od wieku, stanu zdrowia, wybranej sumy ubezpieczenia i zakresu (np. poważne zachorowania, pobyt w szpitalu). Dlatego zamiast cennika przygotowujemy kilka wariantów pod Twój budżet — zwykle w ciągu 24 godzin.",
  },
  {
    question: "Od ilu osób można ubezpieczyć firmę grupowo?",
    answer:
      "Ubezpieczenie grupowe zrobimy już dla właściciela i jednego pracownika, bez ankiety medycznej, od około 30 zł miesięcznie za osobę. Zakres dobieramy do potrzeb zespołu.",
  },
];

export const LOCATIONS: Location[] = [
  {
    slug: "jaworzno",
    path: "/ubezpieczenia-jaworzno",
    city: "Jaworzno",
    inCity: "w Jaworznie",
    title: "Ubezpieczenia Jaworzno — agent ubezpieczeniowy OSCare",
    description:
      "Agent ubezpieczeniowy w Jaworznie: ubezpieczenie na życie i zdrowie, mieszkania, turystyczne, grupowe dla firm. Biuro na Starowiejskiej 43. Wycena w 24h.",
    heading: "Ubezpieczenia w Jaworznie",
    lead: "Jesteśmy agentami ubezpieczeniowymi z Jaworzna. Pomagamy dobrać ubezpieczenie na życie i zdrowie, polisę dla mieszkania, ochronę na wyjazd i ubezpieczenie grupowe dla małej firmy — tłumacząc po ludzku, co obejmuje polisa i czego nie obejmuje.",
    meeting:
      "Spotkamy się tam, gdzie Ci wygodnie: u Ciebie w domu albo w firmie, w naszym biurze przy ul. Starowiejskiej 43 (po wcześniejszym umówieniu) lub online — przez telefon czy wideo.",
    districts: [
      "Śródmieście",
      "Szczakowa",
      "Podłęże",
      "Osiedle Stałe",
      "Jeleń",
      "Byczyna",
      "Ciężkowice",
      "Dąbrowa Narodowa",
      "Pieczyska",
      "Niedzieliska",
    ],
    nearby: ["Mysłowice", "Sosnowiec", "Katowice", "Chrzanów", "Imielin", "Chełmek"],
    faq: [
      {
        question: "Czy muszę przyjechać do biura w Jaworznie?",
        answer:
          "Nie. Większość spraw załatwiamy u klienta albo zdalnie. Jeśli wolisz spotkanie na miejscu, zapraszamy do biura przy ul. Starowiejskiej 43 — wystarczy wcześniej zadzwonić albo zostawić kontakt w formularzu.",
      },
      ...sharedFaq,
    ],
  },
  {
    slug: "katowice",
    path: "/ubezpieczenia-katowice",
    city: "Katowice",
    inCity: "w Katowicach",
    title: "Ubezpieczenia Katowice — agent ubezpieczeniowy OSCare",
    description:
      "Agent ubezpieczeniowy dla Katowic: ubezpieczenie na życie i zdrowie, mieszkania, turystyczne, grupowe dla firm. Dojeżdżamy lub online. Wycena w 24h.",
    heading: "Ubezpieczenia w Katowicach",
    lead: "Pomagamy mieszkańcom i firmom z Katowic wybrać ubezpieczenie na życie i zdrowie, polisę dla mieszkania, ubezpieczenie turystyczne oraz grupowe dla zespołu. Porównujemy warianty i mówimy wprost, za co polisa zapłaci, a za co nie.",
    meeting:
      "Do Katowic dojeżdżamy — spotkamy się u Ciebie w domu, w biurze Twojej firmy albo w kawiarni. Jeśli wolisz, całą rozmowę przeprowadzimy online lub przez telefon.",
    districts: [
      "Śródmieście",
      "Ligota",
      "Panewniki",
      "Podlesie",
      "Brynów",
      "Załęże",
      "Bogucice",
      "Giszowiec",
      "Nikiszowiec",
      "Piotrowice",
      "Kostuchna",
      "Osiedle Tysiąclecia",
    ],
    nearby: ["Chorzów", "Sosnowiec", "Mysłowice", "Siemianowice Śląskie", "Ruda Śląska", "Tychy"],
    faq: [
      {
        question: "Czy macie biuro w Katowicach?",
        answer:
          "Nie prowadzimy stacjonarnego biura w Katowicach — za to przyjeżdżamy do klienta: do domu, do firmy albo w umówione miejsce. Możemy też porozmawiać online, co dla wielu osób jest najwygodniejsze.",
      },
      ...sharedFaq,
    ],
  },
];

export const locationBySlug = (slug: Location["slug"]) =>
  LOCATIONS.find((l) => l.slug === slug) as Location;
