import { PenLine, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { ReviewsWall } from "@/components/site/ReviewsWall";
import { googleLinks } from "@/config/business";
import type { GoogleReviewsFeed } from "@/lib/google-reviews.functions";

/** "Sprawdź nas w Google": intro + rating on the left, rotating review tiles on the right. */
export function GoogleProfile({ feed }: { feed: GoogleReviewsFeed | null }) {
  const reviews = feed?.reviews ?? [];
  const rating = feed?.rating ?? null;

  return (
    <div className="google-profile">
      <div className="google-profile__top">
        <div className="google-profile__intro">
          <span className="eyebrow">Opinie Google</span>
          <h2 className="google-profile__title">
            SPRAWDŹ NAS
            <br />W GOOGLE
          </h2>
          <p className="google-profile__text">
            Prawdziwe opinie naszych klientów prosto z Google — aktualizowane automatycznie.
          </p>

          {rating ? (
            <p className="google-profile__rating">
              <span className="google-profile__rating-value">
                {rating.toFixed(1).replace(".", ",")}
              </span>
              <span className="google-profile__rating-stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={i < Math.round(rating) ? "is-on" : undefined} />
                ))}
              </span>
              <span className="google-profile__rating-label">średnia ocena w Google</span>
            </p>
          ) : null}

          <div className="google-profile__actions">
            <ButtonLink href={googleLinks.reviews} target="_blank" rel="noopener noreferrer">
              <Star className="btn__icon" aria-hidden="true" />
              Zobacz wszystkie opinie
            </ButtonLink>
            <ButtonLink
              href={googleLinks.writeReview}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
            >
              <PenLine className="btn__icon" aria-hidden="true" />
              Wystaw opinię
            </ButtonLink>
          </div>
        </div>

        {reviews.length > 0 ? (
          <ReviewsWall reviews={reviews} />
        ) : (
          <div className="google-profile__empty">Opinie z Google pojawią się tu automatycznie.</div>
        )}
      </div>
    </div>
  );
}
