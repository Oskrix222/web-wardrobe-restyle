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
import { AboutHighlights } from "@/components/site/AboutHighlights";
import { getGoogleReviews } from "@/lib/google-reviews.functions";
import { PageScrollNav } from "@/components/site/PageScrollNav";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import { GOOGLE_BUSINESS } from "@/config/business";
import { organizationJsonLd, seoHead } from "@/lib/seo";

const title = "Ubezpieczenia na życie i zdrowie Jaworzno, Katowice | OSCare";
const description =
  "Agent ubezpieczeniowy z Jaworzna: ubezpieczenie na życie i zdrowie, mieszkania, turystyczne i grupowe dla firm. Jaworzno, Katowice lub online. Wycena w 24h.";

export const Route = createFileRoute("/")({
  // Reviews are a nice-to-have: if the feed is down the block just shows a note.
  // Until OSCare has its own Google listing (GOOGLE_BUSINESS.live) nothing is fetched.
  loader: async () => ({
    reviews: GOOGLE_BUSINESS.live ? await getGoogleReviews().catch(() => null) : null,
  }),
  head: () =>
    seoHead({
      title,
      description,
      path: "/",
      jsonLd: [organizationJsonLd()],
    }),
  component: Index,
});

function Index() {
  const { reviews } = Route.useLoaderData();
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
      <main>
        {/* Inside <main> so the fixed arrows belong to a landmark (accessibility). */}
        <PageScrollNav />
        <Hero onContact={goToForm} rating={reviews?.rating} />
        <About onContact={goToForm} />
        <Categories onPick={pick} />
        <GroupInsurance onPick={pick} />

        <section id="opinie" className="benefits section section--panel">
          <div ref={benefitsReveal.ref} className={cn("benefits__grid", benefitsReveal.className)}>
            {GOOGLE_BUSINESS.live ? <GoogleProfile feed={reviews} /> : null}

            <div className="benefits__contact">
              {/* Desktop only: photo + stats beside the form; phones get just the form. */}
              <AboutHighlights className="benefits__highlights" />
              <LeadForm preselected={preselected} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
