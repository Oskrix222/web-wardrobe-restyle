import { Heart, Home, Plane, Car, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Box, IconCircle } from "@/components/ui/Box";

export const categories = [
  {
    value: "life",
    title: "Życie i zdrowie",
    icon: Heart,
    intro: "Ochrona dla Ciebie i najbliższych na wypadek choroby, wypadku czy utraty dochodu.",
    points: ["Poważne zachorowania", "Pobyt w szpitalu", "Wsparcie dla rodziny"],
  },
  {
    value: "home",
    title: "Majątek",
    icon: Home,
    intro: "Dom, mieszkanie i wyposażenie — od ognia i zalania po kradzież z włamaniem.",
    points: ["Mury i elementy stałe", "Ruchomości domowe", "OC w życiu prywatnym"],
  },
  {
    value: "travel",
    title: "Wakacje",
    icon: Plane,
    intro: "Polisa na każdy wyjazd: leczenie za granicą, bagaż i assistance 24/7.",
    points: ["Koszty leczenia", "Bagaż i sprzęt", "Sporty zimowe"],
  },
  {
    value: "oc",
    title: "OC / AC",
    icon: Car,
    intro: "Komunikacja bez przepłacania — porównujemy składki kilkunastu towarzystw.",
    points: ["OC obowiązkowe", "Autocasco", "Assistance i NNW"],
  },
] as const;

export function Categories({ onPick }: { onPick: (value: string) => void }) {
  return (
    <section id="oferta" className="categories section">
      <div className="container">
        <div className="categories__head">
          <span className="eyebrow">Oferta</span>
          <h2 className="section-heading">WYBIERZ SWOJĄ OCHRONĘ</h2>
          <p className="categories__intro">
            Zabezpieczamy kompleksowo — pojedyncza polisa albo pakiet dopasowany do całej rodziny.
          </p>
        </div>

        <div className="categories__grid">
          {categories.map(({ value, title, icon, intro, points }) => (
            <Box as="article" key={value} interactive className="categories__card">
              <IconCircle icon={icon} />
              <h3 className="categories__title">{title}</h3>
              <p className="categories__text">{intro}</p>

              <ul className="categories__points">
                {points.map((point) => (
                  <li key={point} className="categories__point">
                    <Check aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <Button block className="categories__cta" onClick={() => onPick(value)}>
                Zostaw kontakt
              </Button>
            </Box>
          ))}
        </div>
      </div>
    </section>
  );
}
