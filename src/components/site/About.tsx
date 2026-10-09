import { Phone } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { AboutHighlights } from "@/components/site/AboutHighlights";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import advisor400 from "@/assets/advisor-400.webp";
import advisor640 from "@/assets/advisor-640.webp";
import team640 from "@/assets/team-business-640.webp";
import team1280 from "@/assets/team-business-1280.webp";
import { CONTACT_PHONES, telHref } from "@/config/business";

export function About({ onContact }: { onContact: () => void }) {
  const reveal = useReveal<HTMLDivElement>();
  const figuresIn = useInView();

  return (
    <section id="o-nas" className="about section section--soft">
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

          <div
            ref={figuresIn.ref}
            className={cn("about__figures stagger", figuresIn.inView && "is-in")}
          >
            <figure>
              <img
                src={advisor640}
                srcSet={`${advisor400} 400w, ${advisor640} 640w`}
                sizes="(min-width: 1024px) 18rem, 45vw"
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
                src={team640}
                srcSet={`${team640} 640w, ${team1280} 1280w`}
                sizes="(min-width: 1024px) 18rem, 45vw"
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
            <ButtonLink href={telHref(CONTACT_PHONES[0].phone)} variant="outline">
              <Phone className="btn__icon" aria-hidden="true" />
              {CONTACT_PHONES[0].phone}
            </ButtonLink>
            <Button onClick={onContact}>Zostaw kontakt</Button>
            <ButtonLink href={telHref(CONTACT_PHONES[1].phone)} variant="outline">
              <Phone className="btn__icon" aria-hidden="true" />
              {CONTACT_PHONES[1].phone}
            </ButtonLink>
          </div>
        </Box>

        <AboutHighlights />
      </div>
    </section>
  );
}
