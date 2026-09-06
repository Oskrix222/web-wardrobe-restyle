import { Star } from "lucide-react";

const reviews = [
  {
    name: "Emanuel",
    when: "rok temu",
    text: "Bardzo konkretna rozmowa i jasne wytłumaczenie warunków. Polisa na życie dopasowana do budżetu.",
  },
  {
    name: "Ryan",
    when: "rok temu",
    text: "Szybki kontakt i pomoc przy zgłoszeniu szkody w mieszkaniu. Wszystko załatwione bez stresu.",
  },
  {
    name: "Karolina",
    when: "miesiąc temu",
    text: "Porównanie ofert kilku towarzystw w jednym miejscu — zaoszczędziłam sporo na OC i AC.",
  },
  {
    name: "Basia",
    when: "5 miesięcy temu",
    text: "Wreszcie ktoś wytłumaczył mi wykluczenia w polisie prostym językiem. Polecam.",
  },
  {
    name: "Beso",
    when: "6 miesięcy temu",
    text: "Ubezpieczenie grupowe dla naszej czteroosobowej firmy — proste i tanie rozwiązanie.",
  },
  {
    name: "Girts",
    when: "7 miesięcy temu",
    text: "Świetny kontakt, szybka wycena i pełne wsparcie przy podpisaniu umowy.",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-terracotta text-terracotta" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="opinie" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
              Opinie klientów
            </span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">CO MÓWIĄ KLIENCI</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Stars />
              <span className="text-sm text-muted-foreground">4,9 / 5 na podstawie 19 opinii</span>
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracotta/10 font-display text-lg text-terracotta">
                  {review.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.when}</p>
                </div>
              </div>
              <div className="mt-4">
                <Stars />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border pt-8">
          {["PZU", "Warta", "Allianz", "Generali", "Nationale-Nederlanden"].map((brand) => (
            <span
              key={brand}
              className="font-display text-xl uppercase tracking-wide text-muted-foreground/60"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
