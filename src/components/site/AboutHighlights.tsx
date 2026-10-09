import { HeartHandshake, Banknote, Clock, Phone, Sparkles, Shield } from "lucide-react";

import { Box, IconCircle } from "@/components/ui/Box";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { STATS } from "@/config/business";
import family640 from "@/assets/about-family-640.webp";
import family1280 from "@/assets/about-family-1280.webp";

const stats = [
  { value: STATS.clients, label: "zadowolonych klientów", icon: HeartHandshake },
  { value: STATS.payouts, label: "Zrealizowanych wypłat", icon: Banknote },
  { value: "24h", label: "Na przygotowanie oferty", icon: Clock },
  { value: "100%", label: "Kontaktu w 24h", icon: Phone },
  { value: "100%", label: "Świeże oferty", icon: Sparkles },
  { value: "100%", label: "Ochrony w budżecie klienta", icon: Shield },
];

/**
 * Family photo + the six stat tiles. Shown in "O nas" and again beside the
 * contact form on large screens — edit the stats here and both update.
 */
export function AboutHighlights({ className }: { className?: string }) {
  const imageIn = useInView<HTMLImageElement>();
  const statsIn = useInView();

  return (
    <div className={cn("about__aside", className)}>
      <img
        src={family1280}
        srcSet={`${family640} 640w, ${family1280} 1280w`}
        sizes="(min-width: 1024px) 45vw, 100vw"
        alt="Rodzina trzymająca się za ręce o zachodzie słońca"
        ref={imageIn.ref}
        className={cn("about__aside-image", imageIn.inView && "is-in")}
        data-animate="zoom"
        width={1280}
        height={853}
        loading="lazy"
        decoding="async"
      />
      <div ref={statsIn.ref} className={cn("about__stats stagger", statsIn.inView && "is-in")}>
        {stats.map(({ value, label, icon }) => (
          <Box key={label} className="about__stat">
            <div>
              <p className="about__stat-value">{value}</p>
              <p className="about__stat-label">{label}</p>
            </div>
            <IconCircle icon={icon} size="md" />
          </Box>
        ))}
      </div>
    </div>
  );
}
