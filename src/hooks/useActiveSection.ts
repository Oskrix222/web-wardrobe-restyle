import { useEffect, useState } from "react";

/** Every anchorable section on the page, in actual page order. */
export const SECTION_ORDER = ["top", "o-nas", "oferta", "dla-firm", "opinie", "kontakt"];

/** Tracks which section currently sits just below the fixed header. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Sorted by actual position in the document, not by `ids` order, so the
    // "topmost visible" lookup below reflects what's really on screen.
    const idSet = new Set(ids);
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[id]")).filter((el) =>
      idSet.has(el.id),
    );

    if (sections.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }

        const topMost = sections.find((section) => visible.has(section.id));
        if (topMost) setActive(topMost.id);
      },
      { rootMargin: "-222px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
