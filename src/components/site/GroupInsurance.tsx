import { Users, Wallet, SlidersHorizontal, FileText, Stethoscope, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Box, IconCircle } from "@/components/ui/Box";
import teamImage from "@/assets/team-business.jpg";

const perks = [
  { icon: Users, text: "Min. właściciel + 1 pracownik" },
  { icon: Wallet, text: "Już od 30 zł miesięcznie za osobę" },
  { icon: SlidersHorizontal, text: "Zakres dostosowany do preferencji" },
  { icon: FileText, text: "Bez skomplikowanej ankiety medycznej" },
  { icon: Stethoscope, text: "Pakiety medyczne i rehabilitacja" },
  { icon: LifeBuoy, text: "Wsparcie przy zgłaszaniu świadczeń" },
];

export function GroupInsurance({ onPick }: { onPick: (value: string) => void }) {
  return (
    <section id="dla-firm" className="group-insurance section section--bordered">
      <div className="group-insurance__grid">
        <div>
          <span className="eyebrow">Dla firm</span>
          <h2 className="group-insurance__title">UBEZPIECZENIE GRUPOWE</h2>
          <p className="group-insurance__text">
            Realna korzyść dla zespołu i niska składka dzięki warunkom grupowym — nawet w
            kilkuosobowej firmie.
          </p>

          <ul className="group-insurance__perks">
            {perks.map(({ icon, text }) => (
              <Box as="li" key={text} className="group-insurance__perk">
                <span>{text}</span>
                <IconCircle icon={icon} size="sm" />
              </Box>
            ))}
          </ul>

          <Button size="lg" className="group-insurance__cta" onClick={() => onPick("business")}>
            Zostaw kontakt
          </Button>
        </div>

        <img
          src={teamImage}
          alt="Zespół małej firmy objęty ubezpieczeniem grupowym"
          className="group-insurance__image"
          width={1280}
          height={1024}
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
