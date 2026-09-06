import { Star } from "lucide-react";
import { Box } from "@/components/ui/Box";

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

function Stars({ className }: { className?: string }) {
  return (
    <div className={className ? `stars ${className}` : "stars"} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="opinie" className="testimonials section">
      <div className="container">
        <div>
          <span className="eyebrow">Opinie klientów</span>
          <h2 className="section-heading">CO MÓWIĄ KLIENCI</h2>
          <div className="testimonials__rating">
            <Stars />
            <span className="testimonials__rating-text">4,9 / 5 na podstawie 19 opinii</span>
          </div>
        </div>

        <ul className="testimonials__list">
          {reviews.map((review) => (
            <Box as="li" key={review.name}>
              <div className="testimonials__head-row">
                <span className="testimonials__avatar">{review.name.charAt(0)}</span>
                <div>
                  <p className="testimonials__name">{review.name}</p>
                  <p className="testimonials__when">{review.when}</p>
                </div>
              </div>
              <Stars className="testimonials__stars" />
              <p className="testimonials__quote">{review.text}</p>
            </Box>
          ))}
        </ul>

        <div className="testimonials__brands">
          {["PZU", "Warta", "Allianz", "Generali", "Nationale-Nederlanden"].map((brand) => (
            <span key={brand} className="testimonials__brand">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
