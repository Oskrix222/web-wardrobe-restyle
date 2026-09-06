import { ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-family.jpg";

export function Hero({ onContact }: { onContact: () => void }) {
  return (
    <section id="top" className="relative pt-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-12">
        <div className="flex flex-col justify-between px-4 py-12 sm:px-6 lg:col-span-5 lg:px-8 lg:py-16">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Shield className="h-4 w-4 shrink-0 text-terracotta" />
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Ubezpieczenia dla całej rodziny
            </span>
          </div>

          <div className="my-auto py-12">
            <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              SPOKÓJ,
              <br />
              <span className="text-terracotta">KTÓREGO</span>
              <br />
              NIE DA SIĘ
              <br />
              WYCENIĆ
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Doradztwo ubezpieczeniowe, które stawia ludzi ponad polisami. Porównujemy oferty,
              tłumaczymy drobny druk i pomagamy wybrać ochronę dopasowaną do Twojego życia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="h-12 px-8 text-base" onClick={onContact}>
                Bezpłatna wycena
              </Button>
              <a
                href="#oferta"
                className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium transition-colors hover:bg-accent"
              >
                Zobacz ofertę
              </a>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-border pt-8">
            {[
              ["+25", "zadowolonych klientów"],
              ["24h", "czas odpowiedzi"],
              ["2005", "od tego roku w branży"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-display text-3xl">{value}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative lg:col-span-7">
          <div className="h-[55vh] overflow-hidden sm:h-[65vh] lg:h-full">
            <img
              src={heroImage}
              alt="Rodzina w jasnym salonie — ubezpieczenia KAMIEŃ"
              className="h-full w-full object-cover"
              width={1280}
              height={1024}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <a
        href="#o-nas"
        className="mx-auto mb-8 hidden w-fit flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground lg:flex"
        aria-label="Przewiń do sekcji o nas"
      >
        <span className="font-mono text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="animate-float h-5 w-5" />
      </a>
    </section>
  );
}
