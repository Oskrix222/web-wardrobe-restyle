import { Award, HeartHandshake, Clock, ShieldCheck, Phone } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Box, IconCircle } from "@/components/ui/Box";
import advisorImage from "@/assets/advisor.jpg";
import teamImage from "@/assets/team-business.jpg";

const stats = [
  { value: "+25", label: "zadowolonych klientów rocznie", icon: HeartHandshake },
  { value: "20 lat", label: "doświadczenia w branży", icon: Award },
  { value: "24h", label: "na przygotowanie oferty", icon: Clock },
  { value: "100%", label: "wsparcia przy szkodzie", icon: ShieldCheck },
];

export function About({ onContact }: { onContact: () => void }) {
  return (
    <section id="o-nas" className="about section section--soft">
      <div className="about__grid">
        <Box panel>
          <span className="eyebrow">Poznaj nas</span>
          <h2 className="section-heading">O NAS</h2>
          <p className="about__text">
            W branży ubezpieczeniowej pracuję od 2005 roku. Specjalizuję się w ubezpieczeniach na
            życie i zdrowie dla klientów indywidualnych oraz w polisach grupowych dla firm.
            Zapraszam do kontaktu — wspólnie wybierzemy najlepsze rozwiązanie.
          </p>

          <div className="about__figures">
            <figure>
              <img
                src={advisorImage}
                alt="Doradca ubezpieczeniowy KAMIEŃ w biurze"
                className="about__figure-image"
                width={1024}
                height={1280}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="about__caption">
                Jeden doradca prowadzi Twoją sprawę od pierwszej rozmowy aż po wypłatę świadczenia.
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
                Obsługujemy też małe firmy — polisy grupowe już od kilku osób w zespole.
              </figcaption>
            </figure>
          </div>

          <div className="about__actions">
            <Button onClick={onContact}>Zostaw kontakt</Button>
            <ButtonLink href="tel:+48123456789" variant="outline">
              <Phone className="btn__icon" aria-hidden="true" />
              +48 123 456 789
            </ButtonLink>
          </div>
        </Box>

        <div className="about__aside">
          <img
            src={teamImage}
            alt="Spotkanie doradcy z klientami"
            className="about__aside-image"
            width={1280}
            height={1024}
            loading="lazy"
            decoding="async"
          />
          <div className="about__stats">
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
