import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin, PenLine, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { GOOGLE_BUSINESS, googleLinks } from "@/config/business";

/** Optional: Trustindex widget ID (free Google-reviews widget, auto-updating). */
const TRUSTINDEX_WIDGET_ID = import.meta.env["VITE_TRUSTINDEX_WIDGET_ID"] as string | undefined;

/**
 * Google Maps embed. It only loads after a click — Google sets cookies as soon
 * as the map loads, and this way the page stays fast for everyone else.
 */
function MapCard() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="google-profile__map">
      {loaded ? (
        <iframe
          src={googleLinks.mapEmbed}
          title={`Mapa Google — ${GOOGLE_BUSINESS.name}`}
          className="google-profile__map-frame"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          className="google-profile__map-placeholder"
          onClick={() => setLoaded(true)}
        >
          <span className="google-profile__map-pin" aria-hidden="true">
            <MapPin />
          </span>
          <span className="google-profile__map-name">{GOOGLE_BUSINESS.name}</span>
          <span className="google-profile__map-address">{GOOGLE_BUSINESS.address}</span>
          <span className="google-profile__map-cta">Pokaż mapę z oceną w Google</span>
          <span className="google-profile__map-note">
            Po kliknięciu mapa załaduje się z serwerów Google.
          </span>
        </button>
      )}
    </div>
  );
}

/** Trustindex loader inserts the widget right where its script tag sits. */
function TrustindexReviews({ widgetId }: { widgetId: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inject = () => {
      if (el.querySelector("script")) return;
      const script = document.createElement("script");
      script.src = `https://cdn.trustindex.io/loader.js?${widgetId}`;
      script.defer = true;
      script.async = true;
      el.appendChild(script);
    };
    // Load only when the block is about to scroll into view.
    if (typeof IntersectionObserver === "undefined") {
      inject();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        inject();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [widgetId]);

  return <div ref={ref} className="google-profile__reviews" />;
}

/** "Opinie i lokalizacja": map with Google's live rating card + review links. */
export function GoogleProfile() {
  return (
    <div className="google-profile">
      <div className="google-profile__top">
        <div className="google-profile__intro">
          <span className="eyebrow">Opinie i lokalizacja</span>
          <h2 className="google-profile__title">
            SPRAWDŹ NAS
            <br />W GOOGLE
          </h2>
          <p className="google-profile__text">
            Prawdziwe opinie naszych klientów prosto z Google — aktualna ocena i liczba recenzji
            widoczne na mapie.
          </p>

          <div className="google-profile__actions">
            <ButtonLink href={googleLinks.reviews} target="_blank" rel="noopener noreferrer">
              <Star className="btn__icon" aria-hidden="true" />
              Zobacz opinie w Google
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
            <a
              href={googleLinks.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="google-profile__maps-link"
            >
              Wyznacz trasę
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </div>

        <MapCard />
      </div>

      {TRUSTINDEX_WIDGET_ID ? <TrustindexReviews widgetId={TRUSTINDEX_WIDGET_ID} /> : null}
    </div>
  );
}
