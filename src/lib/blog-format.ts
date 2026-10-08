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

/** "Nowa oferta OC!" -> "nowa-oferta-oc" — a reasonable starting slug the author can still edit. */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    // "ł" has no decomposed form, so NFD alone would turn "małej" into "ma-ej".
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type PostHeading = { id: string; text: string };

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  nbsp: " ",
};

const decodeEntities = (text: string) =>
  text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity, name: string) => ENTITIES[name] ?? entity);

/**
 * Gives every <h2> of a post an id ("#na-co-uwazac") so the table of contents
 * (and Google's "Przejdź do" links) can jump to it. Returns the headings in order.
 */
export function withHeadingAnchors(html: string): { html: string; headings: PostHeading[] } {
  const headings: PostHeading[] = [];
  const used = new Set<string>();
  const withIds = html.replace(
    /<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi,
    (match, attrs: string | undefined = "", inner: string) => {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, "")).trim();
      if (!text) return match;
      const existing = /\sid="([^"]+)"/.exec(attrs)?.[1];
      let id = existing ?? (slugify(text) || "sekcja");
      for (let n = 2; !existing && used.has(id); n++) id = `${slugify(text) || "sekcja"}-${n}`;
      used.add(id);
      headings.push({ id, text });
      return existing ? match : `<h2${attrs} id="${id}">${inner}</h2>`;
    },
  );
  return { html: withIds, headings };
}

/**
 * Puts a block (the "Zostaw kontakt" box) in the middle of a post: before the
 * middle <h2>, or after the middle paragraph when the post has no sections.
 * Done at render time, so it survives editing the post in the panel.
 */
export function withMiddleBlock(html: string, block: string): string {
  const h2s = [...html.matchAll(/<h2[\s>]/gi)];
  if (h2s.length >= 2) {
    const at = h2s[Math.floor(h2s.length / 2)]!.index!;
    return `${html.slice(0, at)}${block}${html.slice(at)}`;
  }
  const paragraphs = [...html.matchAll(/<\/p>/gi)];
  if (paragraphs.length < 4) return html;
  const end = paragraphs[Math.floor(paragraphs.length / 2)]!;
  const at = end.index! + end[0].length;
  return `${html.slice(0, at)}${block}${html.slice(at)}`;
}
