import { Box, IconCircle } from "@/components/ui/Box";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ABOUT_STATS, type Stat } from "@/config/stats";
import family640 from "@/assets/about-family-640.webp";
import family1280 from "@/assets/about-family-1280.webp";

/**
 * Photo + stat tiles. "O nas" shows the six ABOUT_STATS; beside the contact
 * form (large screens) it shows the hero's KEY_STATS.
 */
export function AboutHighlights({
  className,
  stats = ABOUT_STATS,
}: {
  className?: string;
  stats?: Stat[];
}) {
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
      <div
        ref={statsIn.ref}
        className={cn(
          "about__stats stagger",
          stats.length === 3 && "about__stats--three",
          statsIn.inView && "is-in",
        )}
      >
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
