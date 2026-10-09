import { useCallback, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  HeartPulse,
  House,
  MapPin,
  MessagesSquare,
  Phone,
  Plane,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LeadForm } from "@/components/site/LeadForm";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { Box } from "@/components/ui/Box";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BUSINESS, CONTACT_PHONES, telHref } from "@/config/business";
import type { Location } from "@/config/locations";

const products = [
  {
    value: "life",
    icon: HeartPulse,
    title: "Na życie i zdrowie",
    text: "Pieniądze dla rodziny, gdy Ciebie zabraknie, gotówka po diagnozie poważnej choroby i świadczenie za pobyt w szpitalu.",
  },
  {
    value: "home",
    icon: House,
    title: "Mieszkanie i dom",
    text: "Mury, ruchomości, zalanie, przepięcia i kradzież — oraz OC w życiu prywatnym, gdy niechcący zalejesz sąsiada.",
  },
  {
    value: "travel",
    icon: Plane,
    title: "Turystyczne",
    text: "Koszty leczenia za granicą, assistance 24/7, bagaż, sporty zimowe i odwołanie podróży.",
  },
  {
    value: "business",
    icon: BriefcaseBusiness,
    title: "Grupowe dla firm",
    text: "Ubezpieczenie dla właściciela i pracowników już od dwóch osób, bez ankiety medycznej.",
  },
] as const;

const steps = [
  {
    icon: MessagesSquare,
    title: "Rozmowa",
    text: "Kilkanaście minut o tym, kogo i przed czym chcesz chronić oraz ile możesz miesięcznie przeznaczyć.",
  },
  {
    icon: ScanSearch,
    title: "Porównanie",
    text: "Przygotowujemy warianty i pokazujemy różnice w zakresie, wyłączeniach i karencji — zwykle w 24h.",
  },
  {
    icon: ShieldCheck,
    title: "Polisa i opieka",
    text: "Pomagamy przy podpisaniu, a później przy zgłoszeniu szkody czy wniosku o wypłatę.",
  },
];

export function LocationPage({ location }: { location: Location }) {
  const [preselected, setPreselected] = useState<string>();

  const goToForm = useCallback(() => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const pick = (value: string) => {
    setPreselected(value);
    goToForm();
  };

  return (
    <div className="page">
      <Header onContact={goToForm} />

      <main>
        <section className="location section section--panel">
          <div className="container">
            <Breadcrumbs
              items={[
                { label: "Strona główna", to: "/" },
                { label: `Ubezpieczenia ${location.city}` },
              ]}
            />

            <div className="location__hero">
              <div>
                <span className="eyebrow">Agent ubezpieczeniowy · {location.city}</span>
                <h1 className="location__title">{location.heading}</h1>
                <p className="location__lead">{location.lead}</p>
                <div className="location__actions">
                  <Button size="lg" onClick={goToForm}>
                    Bezpłatna wycena
                  </Button>
                  <ButtonLink href={telHref(CONTACT_PHONES[0].phone)} variant="outline" size="lg">
                    <Phone className="btn__icon" aria-hidden="true" />
                    {CONTACT_PHONES[0].phone}
                  </ButtonLink>
                </div>
              </div>

              <Box panel shadow className="location__card">
                <p className="location__card-title">
                  <MapPin aria-hidden="true" /> Jak się spotkamy {location.inCity}?
                </p>
                <p>{location.meeting}</p>
                <ul className="location__people">
                  {CONTACT_PHONES.map((c) => (
                    <li key={c.phone}>
                      <span>{c.fullName}</span>
                      <a href={telHref(c.phone)}>{c.phone}</a>
                    </li>
                  ))}
                </ul>
                <p className="location__card-note">
                  {BUSINESS.name} · {BUSINESS.street}, {BUSINESS.postalCode} {BUSINESS.city}
                </p>
              </Box>
            </div>
          </div>
        </section>

        <section className="location-offer section" aria-labelledby="location-offer-title">
          <div className="container">
            <span className="eyebrow">W czym pomagamy</span>
            <h2 id="location-offer-title" className="location__h2">
              Ubezpieczenia {location.inCity} dla rodzin i firm
            </h2>
            <ul className="location-offer__grid">
              {products.map(({ value, icon: Icon, title, text }) => (
                <Box as="li" key={value} panel className="location-offer__card">
                  <Icon className="location-offer__icon" aria-hidden="true" />
                  <h3 className="location-offer__title">{title}</h3>
                  <p>{text}</p>
                  <button
                    type="button"
                    className="location-offer__link"
                    onClick={() => pick(value)}
                  >
                    Poproś o wycenę →
                  </button>
                </Box>
              ))}
            </ul>
          </div>
        </section>

        <section className="location-steps section section--panel" aria-labelledby="steps-title">
          <div className="container">
            <span className="eyebrow">Jak pracujemy</span>
            <h2 id="steps-title" className="location__h2">
              Od rozmowy do polisy w trzech krokach
            </h2>
            <ol className="location-steps__list">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="location-steps__item">
                  <span className="location-steps__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <Icon className="location-steps__icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="location-area section" aria-labelledby="area-title">
          <div className="container">
            <span className="eyebrow">Gdzie działamy</span>
            <h2 id="area-title" className="location__h2">
              {location.city} i okolice
            </h2>
            <p className="location__text">
              Klientów obsługujemy w całym mieście — m.in. w dzielnicach:
            </p>
            <ul className="location-area__chips">
              {location.districts.map((district) => (
                <li key={district}>{district}</li>
              ))}
            </ul>
            <p className="location__text">
              Dojeżdżamy też do sąsiednich miast: {location.nearby.join(", ")}. A jeśli mieszkasz
              dalej — porozmawiamy online.
            </p>
          </div>
        </section>

        <section className="location-faq section section--panel" aria-labelledby="faq-title">
          <div className="container">
            <span className="eyebrow">Pytania i odpowiedzi</span>
            <h2 id="faq-title" className="location__h2">
              Najczęstsze pytania
            </h2>
            <div className="location-faq__list">
              {location.faq.map((item) => (
                <details key={item.question} className="location-faq__item">
                  <summary>
                    {item.question}
                    <ChevronDown aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="location-contact section" aria-label="Formularz kontaktowy">
          <div className="container location-contact__inner">
            <LeadForm preselected={preselected} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
