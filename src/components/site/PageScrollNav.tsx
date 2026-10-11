import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useActiveSection, SECTION_ORDER } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  top: "górę strony",
  "o-nas": "sekcji O nas",
  oferta: "sekcji Oferta",
  "dla-firm": "sekcji Dla firm",
  opinie: "sekcji Opinie",
  faq: "sekcji FAQ",
  kontakt: "sekcji Kontakt",
};

/**
 * One global, fixed pair of scroll buttons (up near the header, down near the
 * bottom) whose targets follow whichever section is currently active. Fixed
 * rather than per-section so there is always exactly one of each on screen.
 * Both stay mounted and fade/slide in and out; a hidden one is inert.
 */
export function PageScrollNav() {
  const activeId = useActiveSection(SECTION_ORDER);
  const index = SECTION_ORDER.indexOf(activeId ?? "top");
  const prevId = index > 0 ? SECTION_ORDER[index - 1] : null;
  const nextId = index >= 0 && index < SECTION_ORDER.length - 1 ? SECTION_ORDER[index + 1] : null;

  // The down arrow would float over the dark footer — hide it once the footer shows.
  const [footerVisible, setFooterVisible] = useState(false);
  useEffect(() => {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) =>
      setFooterVisible(entry?.isIntersecting ?? false),
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  // While an arrow fades out it keeps pointing where it pointed last.
  const [lastPrev, setLastPrev] = useState("top");
  const [lastNext, setLastNext] = useState("o-nas");
  useEffect(() => {
    if (prevId) setLastPrev(prevId);
  }, [prevId]);
  useEffect(() => {
    if (nextId) setLastNext(nextId);
  }, [nextId]);

  const upTarget = prevId ?? lastPrev;
  const downTarget = nextId ?? lastNext;
  const showUp = Boolean(prevId);
  const showDown = Boolean(nextId) && !footerVisible;

  return (
    <>
      <a
        href={`#${upTarget}`}
        aria-label={`Przewiń do ${SECTION_LABELS[upTarget]}`}
        className={cn("page-scroll-nav page-scroll-nav--top", showUp && "is-visible")}
        inert={!showUp}
      >
        <ChevronUp aria-hidden="true" />
      </a>
      <a
        href={`#${downTarget}`}
        aria-label={`Przewiń do ${SECTION_LABELS[downTarget]}`}
        className={cn("page-scroll-nav page-scroll-nav--bottom", showDown && "is-visible")}
        inert={!showDown}
      >
        <ChevronDown aria-hidden="true" />
      </a>
    </>
  );
}
