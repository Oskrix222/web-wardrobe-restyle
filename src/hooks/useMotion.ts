import { useEffect } from "react";

const SELECTOR = ".stagger, [data-animate]";

/**
 * One page-wide IntersectionObserver for scroll-in animations: adds `is-in`
 * the first time a `.stagger` group or `[data-animate]` element is ~10% on
 * screen, then stops watching it. A MutationObserver picks up elements that
 * appear later (route changes, toggled panels). The animations themselves are
 * pure CSS (see _motion.scss), transform + opacity only.
 */
export function useMotion() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    const watch = (el: Element) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    };
    const scan = (root: ParentNode) => root.querySelectorAll(SELECTOR).forEach(watch);

    scan(document);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) watch(node);
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
