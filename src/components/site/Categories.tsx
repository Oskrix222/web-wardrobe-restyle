import { Heart, Home, Plane, Car, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <section id="oferta" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
            Oferta
          </span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">WYBIERZ SWOJĄ OCHRONĘ</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Zabezpieczamy kompleksowo — pojedyncza polisa albo pakiet dopasowany do całej rodziny.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ value, title, icon: Icon, intro, points }) => (
            <article
              key={value}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-terracotta/40"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-terracotta/10">
                <Icon className="h-6 w-6 text-terracotta" />
              </span>
              <h3 className="mt-5 font-display text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{intro}</p>

              <ul className="mt-5 space-y-2">
                {points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" />
                    <span className="min-w-0">{point}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-6 w-full" onClick={() => onPick(value)}>
                Zostaw kontakt
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
