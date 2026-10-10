// Platform rules applied to captions right before publishing, so a post never
// loses reach (or gets rejected) because of a rule that changed after it was written.
import { PRIMARY_PHONE } from "@/config/business";

/** Instagram allows at most 5 hashtags per post/reel (since the end of 2025). */
export const MAX_HASHTAGS = 5;
export const IG_CAPTION_LIMIT = 2200;

const HASHTAG = /#[\p{L}\p{N}_]+/gu;

export const countHashtags = (text: string) => (text.match(HASHTAG) ?? []).length;

/** Keeps the first 5 hashtags and drops the rest (with the space before them). */
export function limitHashtags(text: string, max = MAX_HASHTAGS): string {
  let seen = 0;
  return text
    .replace(/[ \t]*#[\p{L}\p{N}_]+/gu, (tag) => (++seen <= max ? tag : ""))
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const normalize = (text: string) =>
  text.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "");

export const FACEBOOK_CTA = `Chcesz ofertę? Napisz do nas wiadomość albo zadzwoń: ${PRIMARY_PHONE}.`;

/**
 * Facebook demotes "engagement bait" — posts asking people to comment
 * (Meta Content Distribution Guidelines). "Napisz „RAK”" works on Instagram,
 * so on Facebook every sentence asking for the keyword becomes a plain
 * "write to us / call us" line.
 */
export function facebookCaption(text: string, keyword: string | null | undefined): string {
  const kw = keyword ? normalize(keyword).trim() : "";
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const asksForKeyword = (sentence: string) => {
    const s = normalize(sentence);
    if (/w komentarzu|skomentuj/.test(s)) return true;
    // "Twoi bliscy…" is fine; "Napisz BLISCY" is the ask.
    return (
      Boolean(kw) &&
      /napisz|wpisz|zostaw|komentarz/.test(s) &&
      new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(s)
    );
  };

  let replaced = false;
  const lines = text.split("\n").map((line) => {
    const sentences = line.split(/(?<=[.!?…])\s+/);
    if (!sentences.some(asksForKeyword)) return line;
    const kept = sentences.filter((s) => !asksForKeyword(s));
    const cta = replaced ? "" : FACEBOOK_CTA;
    replaced = true;
    return [...kept, cta].filter(Boolean).join(" ");
  });
  return limitHashtags(lines.filter((l, i, all) => l || all[i - 1]).join("\n"));
}
