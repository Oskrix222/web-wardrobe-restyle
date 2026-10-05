import { useEffect } from "react";
import { Star, ExternalLink } from "lucide-react";
import { Box } from "@/components/ui/Box";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import type { GoogleReviewsResult } from "@/lib/reviews.functions";

const ELFSIGHT_WIDGET_ID = import.meta.env["VITE_ELFSIGHT_WIDGET_ID"] as string | undefined;
const ELFSIGHT_SCRIPT_SRC = "https://static.elfsight.com/platform/platform.js";

/** Live Google reviews via the Elfsight widget — no Google API key needed. */
function ElfsightReviews({ widgetId }: { widgetId: string }) {
  const reveal = useReveal<HTMLDivElement>();

  useEffect(() => {
    if (document.querySelector(`script[src="${ELFSIGHT_SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = ELFSIGHT_SCRIPT_SRC;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <section id="opinie" className="testimonials section">
      <div ref={reveal.ref} className={cn("container", reveal.className)}>
        <div>
          <span className="eyebrow">Opinie klientów</span>
          <h2 className="section-heading">CO MÓWIĄ KLIENCI</h2>
        </div>
        <div className={`elfsight-app-${widgetId}`} data-elfsight-app-lazy />
      </div>
    </section>
  );
}

const fallbackReviews = [
  {
    name: "Emanuel",
    when: "rok temu",
    rating: 5,
    text: "Bardzo konkretna rozmowa i jasne wytłumaczenie warunków. Polisa na życie dopasowana do budżetu.",
  },
  {
    name: "Ryan",
    when: "rok temu",
    rating: 5,
    text: "Szybki kontakt i pomoc przy zgłoszeniu szkody w mieszkaniu. Wszystko załatwione bez stresu.",
  },
  {
    name: "Karolina",
    when: "miesiąc temu",
    rating: 5,
    text: "Porównanie ofert kilku towarzystw w jednym miejscu — zaoszczędziłam sporo na OC i AC.",
  },
  {
    name: "Basia",
    when: "5 miesięcy temu",
    rating: 5,
    text: "Wreszcie ktoś wytłumaczył mi wykluczenia w polisie prostym językiem. Polecam.",
  },
  {
    name: "Beso",
    when: "6 miesięcy temu",
    rating: 5,
    text: "Ubezpieczenie grupowe dla naszej czteroosobowej firmy — proste i tanie rozwiązanie.",
  },
  {
    name: "Girts",
    when: "7 miesięcy temu",
    rating: 5,
    text: "Świetny kontakt, szybka wycena i pełne wsparcie przy podpisaniu umowy.",
  },
];

type ReviewCard = {
  id: string;
  name: string;
  when: string;
  rating: number;
  text: string;
  photoUrl: string | null;
  profileUrl: string | null;
};

function Stars({ rating, className }: { rating: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <div className={className ? `stars ${className}` : "stars"} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < filled ? undefined : "stars__star--empty"} />
      ))}
    </div>
  );
}

export function Testimonials({ googleReviews }: { googleReviews: GoogleReviewsResult | null }) {
  const reveal = useReveal<HTMLDivElement>();

  if (ELFSIGHT_WIDGET_ID) {
    return <ElfsightReviews widgetId={ELFSIGHT_WIDGET_ID} />;
  }

  const hasGoogleReviews = Boolean(googleReviews && googleReviews.reviews.length > 0);

  const rating = hasGoogleReviews ? googleReviews!.rating : 4.9;
  const totalReviews = hasGoogleReviews ? googleReviews!.totalReviews : 19;

  const reviews: ReviewCard[] = hasGoogleReviews
    ? googleReviews!.reviews.map((review) => ({
        id: review.id,
        name: review.authorName,
        when: review.relativeTime,
        rating: review.rating,
        text: review.text,
        photoUrl: review.authorPhotoUrl,
        profileUrl: review.authorProfileUrl,
      }))
    : fallbackReviews.map((review) => ({
        id: review.name,
        name: review.name,
        when: review.when,
        rating: review.rating,
        text: review.text,
        photoUrl: null,
        profileUrl: null,
      }));

  return (
    <section id="opinie" className="testimonials section">
      <div ref={reveal.ref} className={cn("container", reveal.className)}>
        <div>
          <span className="eyebrow">Opinie klientów</span>
          <h2 className="section-heading">CO MÓWIĄ KLIENCI</h2>
          <div className="testimonials__rating">
            <Stars rating={rating} />
            <span className="testimonials__rating-text">
              {rating.toFixed(1)} / 5 na podstawie {totalReviews} opinii
            </span>
            {hasGoogleReviews && googleReviews!.mapsUrl && (
              <a
                href={googleReviews!.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="testimonials__source"
              >
                Zobacz w Google
                <ExternalLink aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <ul className="testimonials__list">
          {reviews.map((review) => (
            <Box as="li" key={review.id}>
              <div className="testimonials__head-row">
                {review.photoUrl ? (
                  <img
                    src={review.photoUrl}
                    alt=""
                    className="testimonials__avatar-photo"
                    width={40}
                    height={40}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="testimonials__avatar">{review.name.charAt(0)}</span>
                )}
                <div>
                  {review.profileUrl ? (
                    <a
                      href={review.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="testimonials__name"
                    >
                      {review.name}
                    </a>
                  ) : (
                    <p className="testimonials__name">{review.name}</p>
                  )}
                  <p className="testimonials__when">{review.when}</p>
                </div>
              </div>
              <Stars rating={review.rating} className="testimonials__stars" />
              <p className="testimonials__quote">{review.text}</p>
            </Box>
          ))}
        </ul>
      </div>
    </section>
  );
}
