import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Clock, Phone, CheckCircle2, Shield } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Categories } from "@/components/site/Categories";
import { GroupInsurance } from "@/components/site/GroupInsurance";
import { Testimonials } from "@/components/site/Testimonials";
import { LeadForm } from "@/components/site/LeadForm";
import { Footer } from "@/components/site/Footer";

const title = "KAMIEŃ — Ubezpieczenia na życie, majątek i dla firm";
const description =
  "Doradztwo ubezpieczeniowe KAMIEŃ: polisy na życie i zdrowie, majątek, podróże, OC/AC oraz ubezpieczenia grupowe dla firm. Zostaw kontakt — oferta w 24h.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "InsuranceAgency",
          name: "KAMIEŃ",
          description,
          areaServed: "PL",
          telephone: "+48123456789",
          email: "kontakt@kamien.pl",
          address: {
            "@type": "PostalAddress",
            streetAddress: "ul. Przykładowa 12",
            postalCode: "00-000",
            addressLocality: "Warszawa",
            addressCountry: "PL",
          },
          openingHours: ["Mo-Fr 09:00-17:00", "Sa 10:00-14:00"],
        }),
      },
    ],
  }),
  component: Index,
});

const benefits = [
  {
    icon: Clock,
    title: "Oszczędzasz czas",
    text: "Porównujemy oferty wielu towarzystw w jednym miejscu.",
  },
  {
    icon: Phone,
    title: "Masz opiekuna",
    text: "Jeden doradca prowadzi Twoje sprawy od pierwszego kontaktu po wypłatę.",
  },
  {
    icon: CheckCircle2,
    title: "Wiesz, co kupujesz",
    text: "Tłumaczymy polisę prostym językiem — bez marketingowego bełkotu.",
  },
  {
    icon: Shield,
    title: "Jesteś chroniony",
    text: "Pomagamy też przy likwidacji szkód i kontakcie z ubezpieczycielem.",
  },
];

function Index() {
  const [preselected, setPreselected] = useState<string>();

  const goToForm = useCallback(() => {
    document.getElementById("kontakt")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const pick = useCallback(
    (value: string) => {
      setPreselected(value);
      goToForm();
    },
    [goToForm],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onContact={goToForm} />

      <main>
        <Hero onContact={goToForm} />
        <About onContact={goToForm} />
        <Categories onPick={pick} />
        <GroupInsurance onPick={pick} />
        <Testimonials />

        <section className="border-t border-border bg-secondary/30 py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
                Dlaczego KAMIEŃ
              </span>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                UBEZPIECZENIA,
                <br />
                KTÓRE ROZUMIESZ
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                Nie wciskamy gotowych produktów. Najpierw słuchamy, potem dopasowujemy ochronę do
                Twoich realnych potrzeb — bez nadmiarowych klauzul i ukrytych wykluczeń.
              </p>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {benefits.map(({ icon: Icon, title: heading, text }) => (
                  <div key={heading} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-6 w-6 text-terracotta" />
                    <h3 className="mt-4 font-display text-xl">{heading}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <LeadForm preselected={preselected} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
