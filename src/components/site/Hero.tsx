import { Shield } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Box";
import { CountUp } from "@/components/ui/CountUp";
import heroImage from "@/assets/hero-family.jpg";

const stats: [string, string][] = [
  ["+25", "zadowolonych klientów"],
  ["24h", "czas odpowiedzi"],
  ["2005", "od tego roku w branży"],
];

export function Hero({ onContact }: { onContact: () => void }) {
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
              src={heroImage}
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
