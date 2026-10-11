import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FAQ } from "@/config/faq";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

/** "Najczęstsze pytania": native <details> so every answer works without JavaScript. */
export function Faq({ onContact }: { onContact: () => void }) {
  const reveal = useReveal<HTMLDivElement>();

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
          {FAQ.map((item, i) => (
            <details key={item.question} className="faq__item" open={i === 0}>
              <summary className="faq__question">
                <span>{item.question}</span>
                <Plus className="faq__icon" aria-hidden="true" />
              </summary>
              <p className="faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
