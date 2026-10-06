import { HeartHandshake, Banknote, Clock, Phone, Sparkles, Shield } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Box, IconCircle } from "@/components/ui/Box";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import advisorImage from "@/assets/advisor.jpg";
import teamImage from "@/assets/team-business.jpg";
import familyImage from "@/assets/about-family.jpg";

const stats = [
  { value: "+150", label: "zadowolonych klientów", icon: HeartHandshake },
  { value: "+78", label: "Zrealizowanych wypłat", icon: Banknote },
  { value: "24h", label: "Na przygotowanie oferty", icon: Clock },
  { value: "100%", label: "Kontaktu w 24h", icon: Phone },
  { value: "100%", label: "Świeże oferty", icon: Sparkles },
  { value: "100%", label: "Ochrony w budżecie klienta", icon: Shield },
];

export function About({ onContact }: { onContact: () => void }) {
  const reveal = useReveal<HTMLDivElement>();

  return (
    <section id="o-nas" className="about section section--soft">
      <div className="pattern-layer pattern-layer--dark" aria-hidden="true" />
      <div ref={reveal.ref} className={cn("about__grid", reveal.className)}>
        <Box panel>
          <span className="eyebrow">Poznaj nas</span>
          <h2 className="section-heading">O NAS</h2>
          <p className="about__text">
            2 agentów ubezpieczeniowych postanowiło rozszerzyć swoją działalność, by zapewnić
            ochronę ubezpieczeniową w całym kraju w pełni zdalnie. Działamy z osobami fizycznymi, aż
            po małe i średnie firmy. Zapraszamy do kontaktu — wspólnie wybierzemy najlepsze
            rozwiązanie.
          </p>

          <div className="about__figures stagger">
            <figure>
              <img
                src={advisorImage}
                alt="Oskar Kubowicz, agent ubezpieczeniowy OSCare"
                className="about__figure-image about__figure-image--top"
                width={640}
                height={853}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="about__caption">
                <span className="about__caption-name">Oskar Kubowicz</span>
                Agent ubezpieczeniowy ceniący sobie szczerą rozmowę oraz rzetelne wsparcie bez
                naciągania na zbędne polisy. W branży ubezpieczeniowej od 2015 roku, w OSCare od
                2022 roku.
              </figcaption>
            </figure>
            <figure>
              <img
                src={teamImage}
                alt="Zespół firmy objęty ubezpieczeniem grupowym"
                className="about__figure-image"
                width={1280}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="about__caption">
                <span className="about__caption-name">Izumi Sato</span>
                Agent myślący jedynie cyframi. Sprawia, że liczby mówią same za siebie. Ceni
                dokładność i jasne wyliczenia. W branży ubezpieczeniowej od 2014 roku, w OSCare od
                2022 roku.
              </figcaption>
            </figure>
          </div>

          <div className="about__actions">
            <ButtonLink href="tel:+48539075385" variant="outline">
              <Phone className="btn__icon" aria-hidden="true" />
              +48 539 075 385
            </ButtonLink>
            <Button onClick={onContact}>Zostaw kontakt</Button>
            <ButtonLink href="tel:+48123846894" variant="outline">
              <Phone className="btn__icon" aria-hidden="true" />
              +48 123 846 894
            </ButtonLink>
          </div>
        </Box>

        <div className="about__aside">
          <img
            src={familyImage}
            alt="Rodzina trzymająca się za ręce o zachodzie słońca"
            className="about__aside-image"
            data-animate="zoom"
            width={1280}
            height={853}
            loading="lazy"
            decoding="async"
          />
          <div className="about__stats stagger">
            {stats.map(({ value, label, icon }) => (
              <Box key={label} className="about__stat">
                <div>
                  <p className="about__stat-value">{value}</p>
                  <p className="about__stat-label">{label}</p>
                </div>
                <IconCircle icon={icon} size="md" />
              </Box>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
