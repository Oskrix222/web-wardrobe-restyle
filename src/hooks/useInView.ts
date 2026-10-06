import { useCallback, useEffect, useRef, useState } from "react";

/**
 * True once the element has been ~10% on screen (one-shot). Pair with the
 * `.stagger` / `[data-animate]` styles in _motion.scss by adding `is-in` to the
 * className, so React owns the class and server/client markup always match.
 * Uses a callback ref, so a remounted element (e.g. a keyed grid) animates again.
 */
export function useInView<T extends Element = HTMLDivElement>() {
  const [inView, setInView] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    setInView(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        io.disconnect();
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(node);
    observer.current = io;
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return { ref, inView };
}
