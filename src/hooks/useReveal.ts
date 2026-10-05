import { useEffect, useRef, useState } from "react";

/**
 * Fades an element in the first time it scrolls into view, then stops
 * watching it — a one-shot reveal, not a repeating scroll effect.
 * Spread the result onto the element: `<div {...reveal} />`.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, className: visible ? "reveal is-visible" : "reveal" };
}
