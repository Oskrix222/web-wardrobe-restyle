import { Box, IconCircle } from "@/components/ui/Box";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { ABOUT_STATS, type Stat } from "@/config/stats";
import clients640 from "@/assets/about-clients-640.webp";
import clients960 from "@/assets/about-clients-960.webp";
import clients1280 from "@/assets/about-clients-1280.webp";
import clients1920 from "@/assets/about-clients-1920.webp";

export type HighlightPhoto = {
  src: string;
  srcSet: string;
  alt: string;
  /** CSS object-position: keeps the faces in the wide crop. */
  focus?: string;
};

const ABOUT_PHOTO: HighlightPhoto = {
  src: clients1280,
  srcSet: `${clients640} 640w, ${clients960} 960w, ${clients1280} 1280w, ${clients1920} 1920w`,
  alt: "Uśmiechnięci klienci z doradcą przy stole po rozmowie o ubezpieczeniu",
  focus: "center 30%",
};

/**
 * Photo + stat tiles. "O nas" shows the six ABOUT_STATS with clients and their
 * advisor; beside the contact form (large screens) it shows the hero's
 * KEY_STATS with its own photo.
 */
export function AboutHighlights({
  className,
  stats = ABOUT_STATS,
  photo = ABOUT_PHOTO,
}: {
  className?: string;
  stats?: Stat[];
  photo?: HighlightPhoto;
}) {
  const imageIn = useInView<HTMLImageElement>();
  const statsIn = useInView();

  return (
    <div className={cn("about__aside", className)}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="(min-width: 1024px) 45vw, 100vw"
        alt={photo.alt}
        style={photo.focus ? { objectPosition: photo.focus } : undefined}
        ref={imageIn.ref}
        className={cn("about__aside-image", imageIn.inView && "is-in")}
        data-animate="zoom"
        width={1280}
        height={854}
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
