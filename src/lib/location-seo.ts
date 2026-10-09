import type { Location } from "@/config/locations";
import { breadcrumbJsonLd, faqJsonLd, organizationJsonLd, seoHead } from "@/lib/seo";

/** head() for a city page — title, canonical, local business + FAQ + breadcrumbs. */
export function locationHead(location: Location) {
  return seoHead({
    title: location.title,
    description: location.description,
    path: location.path,
    jsonLd: [
      organizationJsonLd(),
      breadcrumbJsonLd([
        { name: "Strona główna", path: "/" },
        { name: `Ubezpieczenia ${location.city}`, path: location.path },
      ]),
      faqJsonLd(location.faq),
    ],
  });
}
