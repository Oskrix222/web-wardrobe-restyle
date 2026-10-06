import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Categories } from "@/components/site/Categories";
import { GroupInsurance } from "@/components/site/GroupInsurance";
import { LeadForm } from "@/components/site/LeadForm";
import { Footer } from "@/components/site/Footer";
import { GoogleProfile } from "@/components/site/GoogleProfile";
import { PageScrollNav } from "@/components/site/PageScrollNav";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

const title = "OSCare Ubezpieczenia — na życie, majątek i dla firm";
const description =
  "Doradztwo ubezpieczeniowe OSCare: polisy na życie i zdrowie, majątek, podróże, OC/AC oraz ubezpieczenia grupowe dla firm. Zostaw kontakt — oferta w 24h.";

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
          name: "OSCare Ubezpieczenia",
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

function Index() {
  const [preselected, setPreselected] = useState<string>();
  const benefitsReveal = useReveal<HTMLDivElement>();

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
    <div className="page">
      <Header onContact={goToForm} />
      <PageScrollNav />

      <main>
        <Hero onContact={goToForm} />
        <About onContact={goToForm} />
        <Categories onPick={pick} />
        <GroupInsurance onPick={pick} />

        <section id="opinie" className="benefits section section--soft">
          <div className="pattern-layer pattern-layer--dark" aria-hidden="true" />
          <div ref={benefitsReveal.ref} className={cn("benefits__grid", benefitsReveal.className)}>
            <GoogleProfile />

            <LeadForm preselected={preselected} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
