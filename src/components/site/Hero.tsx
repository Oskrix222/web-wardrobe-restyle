import { Shield, Star } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Box";
import { CountUp } from "@/components/ui/CountUp";
import hero640 from "@/assets/hero-family-640.webp";
import hero1280 from "@/assets/hero-family-1280.webp";

const stats: [string, string][] = [
  ["+25", "zadowolonych klientów"],
  ["24h", "czas odpowiedzi"],
  ["2005", "od tego roku w branży"],
];

export function Hero({
  onContact,
  rating,
}: {
  onContact: () => void;
  /** Average Google rating; the badge is hidden when it isn't available. */
  rating?: number | null | undefined;
}) {
  return (
    <section id="top" className="hero">
      <div className="hero__grid">
        <div className="hero__copy">
          <Pill icon={Shield}>Ubezpieczenia dla całej rodziny</Pill>

          <div className="hero__center">
            <h1 className="hero__title">
              <span className="hero__line">
                <span>SPOKÓJ,</span>
              </span>
              <span className="hero__line">
                <span className="hero__accent">KTÓREGO</span>
              </span>
              <span className="hero__line">
                <span>NIE DA SIĘ</span>
              </span>
              <span className="hero__line">
                <span>WYCENIĆ</span>
              </span>
            </h1>
            <p className="hero__text">
              Doradztwo ubezpieczeniowe, które stawia ludzi ponad polisami. Porównujemy oferty,
              tłumaczymy drobny druk i pomagamy wybrać ochronę dopasowaną do Twojego życia.
            </p>
            <div className="hero__actions">
              <Button size="lg" onClick={onContact}>
                Bezpłatna wycena
              </Button>
              <ButtonLink href="#oferta" variant="outline" size="lg">
                Zobacz ofertę
              </ButtonLink>
            </div>
            {rating ? (
              <a href="#opinie" className="hero__rating">
                <span className="hero__rating-stars" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={i < Math.round(rating) ? "is-on" : undefined} />
                  ))}
                </span>
                <strong>{rating.toFixed(1).replace(".", ",")}</strong> w opiniach Google
                <span className="hero__rating-link">Zobacz opinie</span>
              </a>
            ) : null}
          </div>

          <dl className="hero__stats">
            {stats.map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <CountUp value={value} className="hero__stat-value" />
                  <span className="hero__stat-label">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hero__media">
          <div className="hero__image-frame">
            <img
              src={hero1280}
              srcSet={`${hero640} 640w, ${hero1280} 1280w`}
              sizes="(min-width: 1024px) 58vw, 100vw"
              alt="Rodzina w jasnym salonie — ubezpieczenia OSCare"
              className="hero__image"
              width={1280}
              height={1024}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
