import { ChevronUp, ChevronDown } from "lucide-react";
import { useActiveSection, SECTION_ORDER } from "@/hooks/useActiveSection";

const SECTION_LABELS: Record<string, string> = {
  top: "górę strony",
  "o-nas": "sekcji O nas",
  oferta: "sekcji Oferta",
  "dla-firm": "sekcji Dla firm",
  opinie: "sekcji Opinie",
  kontakt: "sekcji Kontakt",
};

/**
 * One global, fixed pair of scroll buttons (up near the header, down near the
 * bottom) whose targets follow whichever section is currently active. Fixed
 * rather than per-section so there is always exactly one of each on screen.
 */
export function PageScrollNav() {
  const activeId = useActiveSection(SECTION_ORDER);
  const index = SECTION_ORDER.indexOf(activeId ?? "top");
  const prevId = index > 0 ? SECTION_ORDER[index - 1] : null;
  const nextId = index >= 0 && index < SECTION_ORDER.length - 1 ? SECTION_ORDER[index + 1] : null;

  return (
    <>
      {prevId && (
        <a
          href={`#${prevId}`}
          aria-label={`Przewiń do ${SECTION_LABELS[prevId]}`}
          className="page-scroll-nav page-scroll-nav--top"
        >
          <ChevronUp aria-hidden="true" />
        </a>
      )}
      {nextId && (
        <a
          href={`#${nextId}`}
          aria-label={`Przewiń do ${SECTION_LABELS[nextId]}`}
          className="page-scroll-nav page-scroll-nav--bottom"
        >
          <ChevronDown aria-hidden="true" />
        </a>
      )}
    </>
  );
}
