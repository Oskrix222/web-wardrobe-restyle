import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

import type { GoogleReview } from "@/lib/google-reviews.functions";
import { cn } from "@/lib/utils";

const SLOTS = 6;
const SWAP_EVERY_MS = 4500;
const FADE_MS = 400;

const relative = new Intl.RelativeTimeFormat("pl", { numeric: "auto" });

/** "wczoraj", "3 tygodnie temu", "4 miesiące temu" — coarse enough to match on server and client. */
function timeAgo(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 7) return relative.format(-Math.max(days, 0), "day");
  if (days < 30) return relative.format(-Math.round(days / 7), "week");
  if (days < 365) return relative.format(-Math.round(days / 30), "month");
  return relative.format(-Math.round(days / 365), "year");
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="review-tile__google" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function ReviewTile({ review, leaving }: { review: GoogleReview; leaving: boolean }) {
  return (
    <article className={cn("review-tile", leaving && "is-leaving")}>
      <header className="review-tile__head">
        <span className="review-tile__avatar" aria-hidden="true">
          {initials(review.name)}
        </span>
        <span className="review-tile__who">
          <span className="review-tile__name">{review.name}</span>
          <time className="review-tile__date" dateTime={review.postedAt}>
            {timeAgo(review.postedAt)}
          </time>
        </span>
        <GoogleG />
      </header>
      <span className="review-tile__stars" role="img" aria-label={`Ocena ${review.rating} na 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={i < Math.round(review.rating) ? "is-on" : undefined} />
        ))}
      </span>
      <p className="review-tile__text">{review.text}</p>
    </article>
  );
}

/**
 * Six review tiles; every few seconds one of them fades over to a review that
 * isn't on screen, cycling through all of them. Rotation pauses while the
 * wall is off screen, the tab is hidden or the visitor hovers it, and is off
 * entirely for prefers-reduced-motion.
 */
export function ReviewsWall({ reviews }: { reviews: GoogleReview[] }) {
  const count = Math.min(SLOTS, reviews.length);
  const [slots, setSlots] = useState(() => Array.from({ length: count }, (_, i) => i));
  const [leaving, setLeaving] = useState<number | null>(null);
  const next = useRef(count); // next review index to bring in
  const slotCursor = useRef(0);
  const paused = useRef(false);
  const visible = useRef(false);
  const wallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wallRef.current;
    if (!el || reviews.length <= count) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(([entry]) => {
      visible.current = Boolean(entry?.isIntersecting);
    });
    io.observe(el);

    // Visit slots in a scattered order so the change doesn't sweep left-to-right.
    const order = [0, 4, 2, 5, 1, 3].filter((i) => i < count);
    let fadeTimer = 0;

    const timer = window.setInterval(() => {
      if (!visible.current || paused.current || document.hidden) return;
      const slot = order[slotCursor.current % order.length]!;
      slotCursor.current += 1;
      setLeaving(slot);
      fadeTimer = window.setTimeout(() => {
        setSlots((current) => {
          const updated = [...current];
          // Next review that isn't already showing.
          let candidate = next.current % reviews.length;
          while (current.includes(candidate)) candidate = (candidate + 1) % reviews.length;
          next.current = candidate + 1;
          updated[slot] = candidate;
          return updated;
        });
        setLeaving(null);
      }, FADE_MS);
    }, SWAP_EVERY_MS);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fadeTimer);
      io.disconnect();
    };
  }, [reviews.length, count]);

  return (
    <div
      ref={wallRef}
      className="reviews-wall"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      {slots.map((reviewIndex, slot) => {
        const review = reviews[reviewIndex]!;
        return (
          <ReviewTile key={`${slot}-${review.id}`} review={review} leaving={leaving === slot} />
        );
      })}
    </div>
  );
}
