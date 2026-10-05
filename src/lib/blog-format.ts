const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Warsaw",
});

/** "2026-10-05T…" -> "5 października 2026". */
export function formatPostDate(iso: string | null): string | null {
  return iso ? dateFormatter.format(new Date(iso)) : null;
}

/** Rough reading time at ~200 words/minute, never less than 1 minute. */
export function readingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
