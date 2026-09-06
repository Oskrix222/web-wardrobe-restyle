import { Award, HeartHandshake, Clock, ShieldCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <section id="o-nas" className="border-t border-border bg-secondary/30 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
            Poznaj nas
          </span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">O NAS</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            W branży ubezpieczeniowej pracuję od 2005 roku. Specjalizuję się w ubezpieczeniach na
            życie i zdrowie dla klientów indywidualnych oraz w polisach grupowych dla firm.
            Zapraszam do kontaktu — wspólnie wybierzemy najlepsze rozwiązanie.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <figure>
              <img
                src={advisorImage}
                alt="Doradca ubezpieczeniowy KAMIEŃ w biurze"
                className="h-48 w-full rounded-xl object-cover"
                width={1024}
                height={1280}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Jeden doradca prowadzi Twoją sprawę od pierwszej rozmowy aż po wypłatę świadczenia.
              </figcaption>
            </figure>
            <figure>
              <img
                src={teamImage}
                alt="Zespół firmy objęty ubezpieczeniem grupowym"
                className="h-48 w-full rounded-xl object-cover"
                width={1280}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Obsługujemy też małe firmy — polisy grupowe już od kilku osób w zespole.
              </figcaption>
            </figure>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={onContact} className="sm:w-auto">
              Zostaw kontakt
            </Button>
            <a
              href="tel:+48123456789"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Phone className="h-4 w-4" />
              +48 123 456 789
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <img
            src={teamImage}
            alt="Spotkanie doradcy z klientami"
            className="h-56 w-full rounded-2xl border border-border object-cover sm:h-72"
            width={1280}
            height={1024}
            loading="lazy"
            decoding="async"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="min-w-0">
                  <p className="font-display text-2xl">{value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracotta/10">
                  <Icon className="h-5 w-5 text-terracotta" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
