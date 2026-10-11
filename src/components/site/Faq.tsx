import { useEffect, useRef, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FAQ } from "@/config/faq";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

/**
 * "Najczęstsze pytania": an accordion with one answer open at a time. Answers
 * slide open and closed; a click anywhere outside the open question (or Esc)
 * closes it. Every answer stays in the page for Google, collapsed ones are inert.
 */
export function Faq({ onContact }: { onContact: () => void }) {
  const reveal = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);
  const items = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (open === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!items.current[open]?.contains(event.target as Node)) setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <section id="faq" className="faq section section--soft">
      <div ref={reveal.ref} className={cn("faq__grid", reveal.className)}>
        <div className="faq__intro">
          <span className="eyebrow">FAQ</span>
          <h2 className="section-heading">NAJCZĘSTSZE PYTANIA</h2>
          <p className="faq__text">
            Nie znalazłeś odpowiedzi? Zapytaj nas — odpisujemy w ciągu 24 godzin.
          </p>
          <Button onClick={onContact}>
            Zadaj pytanie
            <ArrowRight className="btn__icon btn__arrow" aria-hidden="true" />
          </Button>
        </div>

        <div className="faq__list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.question}
                ref={(el) => {
                  items.current[i] = el;
                }}
                className={cn("faq__item", isOpen && "is-open")}
              >
                <h3 className="faq__heading">
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    className="faq__question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen((current) => (current === i ? null : i))}
                  >
                    <span>{item.question}</span>
                    <Plus className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className="faq__panel"
                  inert={!isOpen}
                >
                  <div className="faq__panel-inner">
                    <p className="faq__answer">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
