import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** "+25" -> { prefix: "+", target: 25, suffix: "" }; "24h" -> { "", 24, "h" }. */
function parse(value: string) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  if (!match) return null;
  return { prefix: match[1] ?? "", target: Number(match[2]), suffix: match[3] ?? "" };
}

/** Fast start, long soft landing — the count visibly "settles" on the number. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Counts a stat like "+25", "24h" or "2005" up from zero the first time it
 * scrolls into view, then gives the final number a small pop. The final value
 * reserves the width up front, so nothing around it shifts while counting.
 */
export function CountUp({
  value,
  duration = 1600,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const parsed = parse(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!parsed || !el) return;

    const finish = () => {
      setCurrent(parsed.target);
      setDone(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        setCurrent(Math.round(easeOutExpo(progress) * parsed.target));
        if (progress < 1) frame = requestAnimationFrame(tick);
        else finish();
      };
      frame = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
    // Re-running on every render would restart the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={cn("count-up", done && "count-up--done", className)}>
      <span className="sr-only">{value}</span>
      <span className="count-up__stack" aria-hidden="true">
        <span className="count-up__ghost">{value}</span>
        <span className="count-up__live">
          {parsed.prefix}
          {current}
          {parsed.suffix}
        </span>
      </span>
    </span>
  );
}
