import { useEffect, useRef, useState } from "react";
import {
  Heart,
  Home,
  Plane,
  Car,
  Stethoscope,
  Hospital,
  HeartHandshake,
  Building2,
  Sofa,
  ShieldCheck,
  BriefcaseMedical,
  Luggage,
  MountainSnow,
  Banknote,
  UserPlus,
  PiggyBank,
  Phone,
  Info,
  X,
  Activity,
  Users,
  Zap,
  Lock,
  LifeBuoy,
  CalendarX,
  FileCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Box, IconCircle } from "@/components/ui/Box";
import lifeImage from "@/assets/category-life.jpg";
import homeImage from "@/assets/category-home.jpg";
import travelImage from "@/assets/category-travel.jpg";
import businessImage from "@/assets/category-business.jpg";

export const categories = [
  {
    value: "life",
    title: "Życie i zdrowie",
    icon: Heart,
    intro: "Ochrona dla Ciebie i najbliższych na wypadek choroby, wypadku czy utraty dochodu.",
    points: [
      { label: "Poważne zachorowania", icon: Stethoscope },
      { label: "Pobyt w szpitalu", icon: Hospital },
      { label: "Wsparcie dla rodziny", icon: HeartHandshake },
    ],
    details: {
      image: lifeImage,
      imageAlt: "Zabandażowana dłoń po urazie — ochrona na życie i zdrowie",
      intro:
        "Poważna choroba, wypadek czy dłuższy pobyt w szpitalu nie muszą oznaczać kłopotów finansowych. Realne wsparcie dla Ciebie i najbliższych dokładnie wtedy, gdy jest najbardziej potrzebne.",
      points: [
        { label: "Gotówka od razu po diagnozie", icon: Banknote },
        { label: "Dzienne świadczenie za pobyt w szpitalu", icon: Hospital },
        { label: "Trwały uszczerbek po wypadku", icon: Activity },
        { label: "Assistance medyczny 24/7", icon: LifeBuoy },
        { label: "Wsparcie finansowe dla rodziny", icon: HeartHandshake },
        { label: "Współmałżonek i dzieci na jednej polisie", icon: Users },
      ],
    },
  },
  {
    value: "home",
    title: "Majątek",
    icon: Home,
    intro: "Dom, mieszkanie i wyposażenie — od ognia i zalania po kradzież z włamaniem.",
    points: [
      { label: "Mury i elementy stałe", icon: Building2 },
      { label: "Ruchomości domowe", icon: Sofa },
      { label: "OC w życiu prywatnym", icon: ShieldCheck },
    ],
    details: {
      image: homeImage,
      imageAlt: "Strażak gasi pożar na balkonie — ochrona majątku od ognia",
      intro:
        "Dom czy mieszkanie to zwykle największa inwestycja w życiu — warto zabezpieczyć je przed zdarzeniami, na które nie masz wpływu. Ochrona murów, instalacji i wyposażenia wnętrza.",
      points: [
        { label: "Mury i elementy stałe", icon: Building2 },
        { label: "Ruchomości domowe", icon: Sofa },
        { label: "Zalanie i przepięcia", icon: Zap },
        { label: "Kradzież z włamaniem", icon: Lock },
        { label: "OC w życiu prywatnym", icon: ShieldCheck },
        { label: "Assistance domowy 24/7", icon: LifeBuoy },
      ],
    },
  },
  {
    value: "travel",
    title: "Wakacje",
    icon: Plane,
    intro: "Polisa na każdy wyjazd zagraniczny: leczenie za granicą, bagaż i assistance 24/7.",
    points: [
      { label: "Koszty leczenia", icon: BriefcaseMedical },
      { label: "Bagaż i sprzęt", icon: Luggage },
      { label: "Sporty zimowe", icon: MountainSnow },
    ],
    details: {
      image: travelImage,
      imageAlt: "Parasol plażowy nad morzem — ubezpieczenie turystyczne",
      intro:
        "Niezależnie czy wyjeżdżasz na tydzień nad morze, czy na cały sezon narciarski — dobra polisa turystyczna to spokój, gdy coś pójdzie nie tak z dala od domu.",
      points: [
        { label: "Koszty leczenia za granicą", icon: BriefcaseMedical },
        { label: "Assistance 24/7", icon: LifeBuoy },
        { label: "Bagaż i sprzęt sportowy", icon: Luggage },
        { label: "Sporty zimowe i ekstremalne", icon: MountainSnow },
        { label: "Odwołanie podróży", icon: CalendarX },
        { label: "OC za granicą", icon: ShieldCheck },
      ],
    },
  },
  {
    value: "business",
    title: "Grupowe",
    icon: Car,
    intro:
      "Zabezpiecz siebie oraz pracowników grupowym ubezpieczeniem w naprawdę niewygórowanej cenie.",
    points: [
      { label: "Min 30zł/Os.", icon: Banknote },
      { label: "Min Właściciel + pracownik", icon: UserPlus },
      { label: "Najmniejsza składka", icon: PiggyBank },
    ],
    details: {
      image: businessImage,
      imageAlt: "Spotkanie biznesowe zespołu objętego ubezpieczeniem grupowym",
      intro:
        "Ubezpieczenie grupowe to jeden z najbardziej docenianych benefitów pracowniczych — niska, stała składka już w kilkuosobowej firmie i realna ochrona całego zespołu.",
      points: [
        { label: "Min. właściciel + 1 pracownik", icon: UserPlus },
        { label: "Już od 30 zł za osobę", icon: Banknote },
        { label: "Bez ankiety medycznej", icon: FileCheck },
        { label: "Zakres dopasowany do potrzeb", icon: SlidersHorizontal },
        { label: "Pakiety medyczne i rehabilitacja", icon: Stethoscope },
        { label: "Wsparcie przy zgłaszaniu świadczeń", icon: LifeBuoy },
      ],
    },
  },
] as const;

export function Categories({ onPick }: { onPick: (value: string) => void }) {
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const activeCategory = categories.find((c) => c.value === activeValue);
  const detailRef = useRef<HTMLDivElement>(null);

  const handlePick = (value: string) => {
    setActiveValue(null);
    onPick(value);
  };

  useEffect(() => {
    if (!activeCategory) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!detailRef.current?.contains(event.target as Node)) {
        setActiveValue(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeCategory]);

  return (
    <section id="oferta" className="categories section">
      <div className="container">
        <div className="categories__head" data-animate>
          <span className="eyebrow">Oferta</span>
          <h2 className="section-heading">WYBIERZ SWOJĄ OCHRONĘ</h2>
          <p className="categories__intro">
            Zabezpieczamy kompleksowo — pojedyncza polisa albo pakiet dopasowany do całej rodziny.
          </p>
        </div>

        {activeCategory ? (
          <div className="category-detail animate-rise" key={activeCategory.value} ref={detailRef}>
            <button
              type="button"
              className="category-detail__close"
              onClick={() => setActiveValue(null)}
              aria-label="Zamknij szczegóły"
            >
              <X aria-hidden="true" />
            </button>

            <div className="category-detail__grid">
              <div>
                <span className="eyebrow">Szczegóły ochrony</span>
                <h3 className="category-detail__title">{activeCategory.title}</h3>
                <p className="category-detail__intro">{activeCategory.details.intro}</p>

                <ul className="category-detail__perks">
                  {activeCategory.details.points.map(({ label, icon: PerkIcon }) => (
                    <Box as="li" key={label} className="category-detail__perk">
                      <span>{label}</span>
                      <IconCircle icon={PerkIcon} size="sm" />
                    </Box>
                  ))}
                </ul>

                <div className="category-detail__actions">
                  <Button
                    className="category-detail__cta"
                    onClick={() => handlePick(activeCategory.value)}
                  >
                    Zostaw kontakt
                  </Button>
                  <ButtonLink
                    href="tel:+48539075385"
                    variant="outline"
                    className="category-detail__call"
                  >
                    <Phone className="btn__icon" aria-hidden="true" />
                    +48 539 075 385
                  </ButtonLink>
                  <ButtonLink
                    href="tel:+48123846894"
                    variant="outline"
                    className="category-detail__call"
                  >
                    <Phone className="btn__icon" aria-hidden="true" />
                    +48 123 846 894
                  </ButtonLink>
                </div>
              </div>

              <img
                src={activeCategory.details.image}
                alt={activeCategory.details.imageAlt}
                className="category-detail__image"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        ) : (
          <div className="categories__grid stagger" key="grid">
            {categories.map(({ value, title, icon, intro, points }) => (
              <Box as="article" key={value} interactive className="categories__card">
                <button
                  type="button"
                  className="categories__info"
                  onClick={() => setActiveValue(value)}
                  aria-haspopup="true"
                >
                  <Info aria-hidden="true" />
                  <span>Dowiedz się więcej</span>
                </button>

                <IconCircle icon={icon} />
                <h3 className="categories__title">{title}</h3>
                <p className="categories__text">{intro}</p>

                <ul className="categories__points">
                  {points.map(({ label, icon: PointIcon }) => (
                    <li key={label} className="categories__point">
                      <PointIcon aria-hidden="true" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="categories__actions">
                  <Button block onClick={() => onPick(value)}>
                    Zostaw kontakt
                  </Button>
                  <div className="categories__calls">
                    <div className="categories__call">
                      <ButtonLink href="tel:+48539075385" variant="outline" size="sm">
                        <Phone className="btn__icon" aria-hidden="true" />
                        +48 539 075 385
                      </ButtonLink>
                      <span className="categories__call-name">Oskar Kubowicz</span>
                    </div>
                    <div className="categories__call">
                      <ButtonLink href="tel:+48123846894" variant="outline" size="sm">
                        <Phone className="btn__icon" aria-hidden="true" />
                        +48 123 846 894
                      </ButtonLink>
                      <span className="categories__call-name">Izumi Sato</span>
                    </div>
                  </div>
                </div>
              </Box>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
