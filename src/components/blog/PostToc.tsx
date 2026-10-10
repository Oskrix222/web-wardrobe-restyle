import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { PostHeading } from "@/lib/blog-format";

// The site header is fixed and 70 px tall; with the pinned bar the text is readable below this line.
const HEADER = 70;
const READ_LINE = 120;

type Progress = { active: number; fill: number; pinned: boolean };

/**
 * Table of contents for a blog post, drawn as a timeline:
 * - "W tym wpisie" at the top of the article — every section, click to jump;
 * - once that box scrolls away, a slim bar pinned under the header shows which
 *   section is being read ("4/9 · …") with one clickable segment per section.
 */
export function PostToc({ headings }: { headings: PostHeading[] }) {
  const navRef = useRef<HTMLElement>(null);
  // The pinned bar lives in <body>: the article is its own layer (.section--panel)
  // and would otherwise let the sections after it cover the bar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [{ active, fill, pinned }, setProgress] = useState<Progress>({
    active: -1,
    fill: 0,
    pinned: false,
  });

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    const content = elements[0]?.parentElement;
    if (!elements.length || !content) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // The visible reading area: below the fixed header and the pinned bar.
      const viewTop = READ_LINE;
      const viewBottom = window.innerHeight;
      const contentBox = content.getBoundingClientRect();
      // Section i runs from its heading to the next one (-1 = intro before the first heading).
      const bounds = (i: number) => ({
        start: elements[i]?.getBoundingClientRect().top ?? contentBox.top,
        end: elements[i + 1]?.getBoundingClientRect().top ?? contentBox.bottom,
      });
      // The section the reader sees the most of on screen wins.
      let current = -1;
      let best = -Infinity;
      for (let i = -1; i < elements.length; i++) {
        const { start, end } = bounds(i);
        const seen = Math.min(end, viewBottom) - Math.max(start, viewTop);
        if (seen > best) {
          best = seen;
          current = i;
        }
      }
      // How far through that section the middle of the screen is (0–1).
      const { start, end } = bounds(current);
      const middle = (viewTop + viewBottom) / 2;
      const ratio = Math.min(1, Math.max(0, (middle - start) / Math.max(1, end - start)));
      const tocGone = (navRef.current?.getBoundingClientRect().bottom ?? 0) < HEADER;
      const contentLeft = content.getBoundingClientRect().bottom > READ_LINE;
      setProgress({
        active: current,
        fill: Math.round(ratio * 50) / 50,
        pinned: tocGone && contentLeft,
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;
  // Headings like "1. OC zawodowe" carry their own numbers — don't add a second set.
  const numbered = !headings.some((h) => /^\d+[.)]/.test(h.text));

  return (
    <>
      <nav ref={navRef} id="spis-tresci" className="post-toc" aria-label="Spis treści">
        <p className="post-toc__title">W tym wpisie</p>
        <ol className="post-toc__list">
          {headings.map((h, i) => (
            <li
              key={h.id}
              className={i === active ? "is-active" : i < active ? "is-done" : undefined}
              aria-current={i === active ? "location" : undefined}
            >
              <a href={`#${h.id}`}>
                {numbered ? (
                  <span className="post-toc__num">{String(i + 1).padStart(2, "0")}</span>
                ) : null}
                <span>{h.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {mounted
        ? createPortal(
            <div className={pinned ? "post-progress is-visible" : "post-progress"} inert={!pinned}>
              <div className="post-progress__inner">
                <a
                  className="post-progress__label"
                  href="#spis-tresci"
                  title="Wróć do spisu treści"
                >
                  <span className="post-progress__count">
                    {Math.max(0, active + 1)}/{headings.length}
                  </span>
                  <span className="post-progress__name">{headings[active]?.text ?? "Wstęp"}</span>
                </a>
                <div className="post-progress__track">
                  {headings.map((h, i) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="post-progress__seg"
                      aria-label={h.text}
                      title={h.text}
                    >
                      <span
                        style={{ transform: `scaleX(${i < active ? 1 : i === active ? fill : 0})` }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
