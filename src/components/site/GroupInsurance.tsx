import { Users, Wallet, SlidersHorizontal, FileText, Stethoscope, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <section id="dla-firm" className="border-y border-border bg-secondary/30 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
            Dla firm
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            UBEZPIECZENIE GRUPOWE
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Realna korzyść dla zespołu i niska składka dzięki warunkom grupowym — nawet
            w kilkuosobowej firmie.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {perks.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="min-w-0 text-sm">{text}</span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-terracotta/10">
                  <Icon className="h-4 w-4 text-terracotta" />
                </span>
              </li>
            ))}
          </ul>

          <Button className="mt-8" size="lg" onClick={() => onPick("business")}>
            Zostaw kontakt
          </Button>
        </div>

        <img
          src={teamImage}
          alt="Zespół małej firmy objęty ubezpieczeniem grupowym"
          className="h-64 w-full rounded-2xl border border-border object-cover sm:h-96"
          width={1280}
          height={1024}
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
