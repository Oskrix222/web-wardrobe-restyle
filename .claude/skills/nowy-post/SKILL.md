---
name: nowy-post
description: Turns marketing graphics or animations (typically Nationale-Nederlanden posts) into a complete OSCare content package — rebranded post + carousel + story + blog cover, Instagram/Facebook/Google captions, an SEO blog article, 3 reel scripts, UTM links — and sends it to the admin panel's content calendar (/admin/kalendarz) on the next free week. Use whenever the user attaches/pastes graphics, drops them into marketing/wrzuc-tutaj, or asks for "nowy post", "paczka", "przerób grafikę", "zrób opis / wpis / rolki do tej grafiki".
---

# /nowy-post — z grafiki pełna paczka OSCare

The user (Oskar, non-technical, Polish) gets marketing graphics from Nationale-Nederlanden every few weeks.
Your job: one topic → one package with everything needed to publish and sell, placed in the
panel's calendar for one week (blog + post + story + 3 reels). You write all the copy;
`marketing/tools/generate.mjs` renders the graphics and `paczka.html`;
`marketing/tools/panel.mjs` talks to the panel. The user approves everything in the panel and
uploads the filmed reels; the site's cron publishes approved items on their dates.
Talk to the user in plain Polish. Never ask them to run commands.

## Workflow

0. **Read the truths first:** `node marketing/tools/panel.mjs prawdy` — facts the user entered in
   Panel → Prawdy (what they don't sell, who can't be insured, house rules). If the key is missing,
   read the cached `marketing/prawdy.md` and tell the user the panel isn't connected yet.
   See „Prawdy” below for how to apply them — they override everything else in this file.
1. **Collect inputs.** First `node marketing/tools/panel.mjs pobierz` — it unpacks every ZIP the
   user dropped into Panel → Kalendarz → „Nowa paczka” into `marketing/wrzuc-tutaj/<upload-id>/`
   and marks it „Claude przygotowuje…”. Also take paths the user attached (pasted images carry a
   source path) or a folder they name. Ignore `Thumbs.db`, `.DS_Store`.
2. **Look at every file.** Read each image. For `.mp4`, grab 6 frames into the scratchpad
   (`ffmpeg -ss <t> -i f.mp4 -frames:v 1 -vf scale=360:-1 out_<t>.jpg`, t spread over the duration,
   then `hstack` them into one grid) and read the grid. Write down: headline, subline, product,
   occasion/date (often in the filename, e.g. „31 października”), where the people/faces are.
3. **Group by topic.** Every graphic is its own topic → its own package → its own week (the user's
   rule). Only true duplicates of one message (same filename with „(1)”, „(2)”) share a package;
   the extra photo becomes a `variant`.
4. **Decide per topic** using the rules below: skip or reframe (truths, NN-only claims)?
   `layout` photo or text? `formType` (life | home | travel | business — the website form's
   options), comment `keyword`. Week: `node marketing/tools/panel.mjs plan` shows what's taken;
   by default each package goes to the next free week, with the days/hours from the panel's
   Plan tygodnia (don't set `publish` for that). An occasion (10.10, 31.10…) → set `publish`
   with exact dates in that week. Blog authors alternate automatically.
5. **Create the folder** `marketing/posty/<YYYY-MM-DD>-<temat>/` (date = planned main post day) and
   move the sources into its `zrodlo/` (out of `wrzuc-tutaj`; copy if they live elsewhere).
6. **Write `spec.mjs`.** Follow `marketing/tools/example-spec.mjs`: same structure and the same
   quality bar. Template literals let you write multi-line text without escaping.
7. **Render:** `node marketing/tools/generate.mjs marketing/posty/<folder>` (≈20–60 s).
8. **QA — always look.** Read `post-1.png`, one carousel slide, `story.png` and every variant
   (or hstack them with ffmpeg into one image). Check: no trace of NN (logo, orange frame, their
   hashtag); faces/subject not cut (fix `focus`); headline didn't shrink into small type (shorten
   it); text reads naturally in Polish. Fix the spec and re-render until it's right.
9. **Send to the panel:** `node marketing/tools/panel.mjs wyslij marketing/posty/<folder>`.
   It uploads the graphics, creates the blog draft and the calendar items (blog, post, story,
   3 reels) with dates, and prints them. Re-sending updates items that aren't approved yet
   (`--nadpisz` also replaces approved ones — only when the user asks).
10. **Close the ZIP:** `node marketing/tools/panel.mjs zakoncz <upload-id> "4 tygodnie od 12.10;
   pominięto Superbrands (nagroda NN)"` — the panel shows this note. On failure: `blad <id> "…"`.
11. **Hand over.** Tell the user in a few lines: which weeks, what waits for approval, which reels
   to film (by when), and the „Zanim opublikujesz” notes. Link: `<site>/admin/kalendarz`.
   `paczka.html` stays as an offline copy. `marketing/posty/` is git-ignored — nothing to commit.

## Spec reference

| Field | What |
|---|---|
| `topic`, `campaign` | Package title; `campaign` = utm_campaign (`<temat>-<rrrr>-<mm>`). |
| `formType` | `life`, `home`, `travel`, `business`. |
| `keyword` | ONE uppercase word for comments/DM (WSPARCIE, DZIECKO, PODRÓŻ…). Unique per campaign. |
| `label` | Default eyebrow / carousel footer (2–4 words). |
| `post` | `source` (path in `zrodlo/`), `at` (seconds, video frame), `focus: [x, y]` 0–1 within the clean photo (default `[0.5, 0.4]`), `cleanBottom` (px, only if frame detection fails), `layout: "text"` + `cards: [{ icon, text, note }]` for graphics without a usable photo, `label`, `headline` (array of lines), `sub`, `footnote`, `cta` (default „Napisz „KEYWORD” w komentarzu”). |
| `variants` | `[{ source, focus }]` — same texts, another photo. |
| `carousel` | 3 × `{ title, text }`; the CTA slide is added automatically (`carouselCta` to override). |
| `story` | `{ label, text }`. |
| `captions` | `instagram`, `alt`, `facebook` (with `{link}`), `google`, optional `linkedin` (B2B only). |
| `hashtags`, `dm` | 3–5 hashtags; DM reply with `{link}`. |
| `blog` | `title`, `excerpt`, `keyword`, `keywords`, `html` (`slug` only to override). |
| `reels` | Exactly 3 × `{ title, format, length, hook, cover, audio, scenes: [{ time, shot, say, text }], tips, caption }`. |
| `plan`, `notes` | Dated steps (shown in paczka.html); things to check before publishing (shown in the panel). |
| `publish` | Optional: `{ week, blog, post, story, reels: [3] }` as `"YYYY-MM-DD HH:MM"` (Polish time). Without it: next free week, slots from `brand.schedule` (Mon 7:00 blog, Tue/Thu 19:00 + Sat 10:00 reels, Wed 18:00 post, Wed 20:00 story). |

Text markup in graphic fields: `*słowa*` = terracotta accent, `**słowa**` = bold.
Icons: lucide names (https://lucide.dev/icons) — e.g. hand-coins, stethoscope, activity,
shield-check, heart-pulse, plane, house, baby, users, piggy-bank, briefcase, dog, car.

## Rules

### Prawdy (from Panel → Prawdy) — highest priority
- Never contradict a truth, and never imply the opposite (no „każdy dostanie polisę”, no promises
  about acceptance, no hints at products the user doesn't sell).
- Don't write about the restricted subject at all — no disclaimers like „osoby po X nie dostaną
  polisy”. Steer the content around it: pick other angles, other FAQ questions, other reels.
- A source graphic about something the user doesn't offer (e.g. car insurance) → don't make a
  package; tell the user why.
- If a truth makes a whole angle impossible (e.g. underwriting after mental-health treatment),
  drop that angle everywhere: graphics, captions, blog, FAQ, reels, DM.

### Branding and legal (non-negotiable)
- Nothing of NN survives: logo, name in the graphic, the orange speech-bubble frame, their
  hashtag `#ZdrowyDialog`, their slogans. The generator removes the visuals; you rewrite the copy.
- **Awards, rankings and brand claims of the insurer** (e.g. Superbrands, „najsilniejsza marka”)
  are NOT OSCare's. Skip that graphic and tell the user why; offer a truthful alternative only if
  they confirm it (e.g. „Współpracujemy z ubezpieczycielem nagrodzonym…”).
- **Named insurer products** (Pakiet Ortopeda Plus, Asystent domu Premium…): in graphics and
  captions describe the benefit generically („w wybranych pakietach assistance”). In the blog
  name a product only with its insurer and add a note asking the user to confirm they sell it.
- Amounts/limits only as given in the source, phrased „nawet do …” with
  `footnote: "*Zależnie od wariantu i OWU ubezpieczyciela."`.
- Never invent statistics, prices, waiting times, client stories or reviews. Scenes are POV or
  hypothetical („POV:”, „Wyobraź sobie…”), never „nasza klientka…”.
- Health topics: calm and empathetic, no fear-mongering, no medical advice. Point to free public
  options where they exist (NFZ, screening programmes). Mental health: always include
  800 70 2222 (całą dobę), 116 123 and 112.
- Not sure about a fact (programme, age range, law)? Check it with WebSearch first; if you can't
  confirm it, leave it out.
- `marketing/brand.mjs` holds site URL, phone, city, Instagram, author and the legal footnote.
  If `city` or `instagram` is empty, mention once that filling it improves local SEO.

### Voice
Polish, „Ty” form, warm and concrete. OSCare speaks as „my”: porównujemy oferty, tłumaczymy
drobny druk, pomagamy wybrać. Explain jargon (OWU, karencja, suma ubezpieczenia) in a few words.
No „najtańszy”, „gwarancja”, „100%”. Short sentences.

### Graphic copy
- `headline`: 2 lines (3 max), ≤ ~22 characters each; 1–3 accent words.
- `sub`: ≤ 110 characters, the benefit in **bold**.
- Carousel: problem/benefit → what to check → common mistake or myth. Title ≤ 35 characters
  with one accent; text ≤ 190 characters with one bold phrase.

### Captions (SEO for Instagram search)
- First line ≤ 125 characters: hook + the phrase people actually search
  („ubezpieczenie dziecka”, „ubezpieczenie turystyczne”), not internal jargon.
- 120–220 words, short paragraphs, a ✔️ list of 3 benefits, one sentence on why OSCare.
- CTA, always in this form: „Napisz „SŁOWO” w komentarzu, a podeślemy Ci ofertę.” + „Cały
  poradnik: link w pierwszym komentarzu.” The keyword appears ONLY in captions and reel scripts,
  never on graphics. The same caption goes to Instagram and Facebook; the blog link is posted
  automatically as the first comment (`captions.comment` overrides its lead-in text).
- Hashtags 3–5: one broad, two niche, the occasion if any, `#OSCare` (+ `#ubezpieczenia<Miasto>`
  when the city is set).
- `alt`: what's in the photo + the key phrase, ≤ 200 characters.
- `google`: 600–900 characters, no hashtags, phone at the end. `linkedin`: only for business
  topics. (`facebook` is no longer needed — Facebook gets the Instagram caption.)
- `dm`: thanks → `{link}` → 2-line takeaway → one qualifying question (age, existing policy,
  family) → signature „Oskar, OSCare”.

### Blog (the site blog: tiptap editor, pasted as rich text)
- `title` ≤ 60 characters, starting with the main phrase. `excerpt` 140–160 characters (it is the
  meta description).
- 900–1400 words. Allowed HTML: p, h2, h3, ul/ol/li, strong, em, blockquote, a. No tables,
  images or h1.
- The topic is the post's topic; the main phrase is what people google about it. Pick it from
  `marketing/SEO-FRAZY.md` (Google Trends + autocomplete research: rising „jakie ubezpieczenie
  na życie wybrać”, seasonal „ubezpieczenie dziecka” in August, „ubezpieczenie grupowe dla
  małej firmy”…). If nothing there fits, check Google's suggestions for the topic
  (`https://suggestqueries.google.com/complete/search?client=firefox&hl=pl&q=<fraza>`) — never
  guess. Never target car insurance (OC/AC) or competitors' brand names.
- Link once to the local page that fits (`/ubezpieczenia-jaworzno` or `/ubezpieczenia-katowice`,
  anchor like „agent ubezpieczeniowy w Jaworznie”) and, when one exists, to a related post.
- Structure: intro answering the search intent, main phrase in the first 100 words → H2s phrased
  like Google questions (at least 4 — the site builds the table of contents from them) →
  „na co uważać” list → „Ile to kosztuje?” without invented prices → H2 „Najczęstsze pytania”
  with 3–5 H3 questions → summary + last paragraph with `<a href="/#kontakt">Zostaw kontakt</a>`.
  Don't write a mid-article CTA: the site inserts the „Zostaw kontakt” box with both phone numbers
  in the middle of every post by itself. Secondary phrases once or twice each, naturally.
- Facts about the company (years in the business, team, city) come only from the „O nas”
  truths — great for trust (E-E-A-T), never invented.
- The legal footnote is appended automatically.

### Reels — exactly 3, three different formats
1. Myth vs fact / educational hook, to camera, 20–30 s.
2. POV scene or B-roll with captions (voice-over optional), 25–35 s.
3. Answering a question (Q&A, ideally „Odpowiedz rolką” on a real comment), 30–45 s.

Each: hook within 2 s (spoken + on-screen), scenes of 2–10 s, last scene says both
„Napisz SŁOWO w komentarzu, a podeślę Ci ofertę” and „link do poradnika masz w bio”,
cover text ≤ 5 words, audio suggestion, filming tip, caption ≤ 300 characters with the same
keyword CTA + 3 hashtags. Reels go to Instagram and Facebook; Facebook Reels max 90 s, so
keep scripts ≤ 90 s.

### Plan
Blog first (all links point to it) → reel 1 → post/carousel + story + Facebook + Google on the
main day (the occasion, if there is one) → reels 2 and 3 one to two days apart → DM follow-up.
Use real dates from today's date; write them like „czw 08.10”.

### Special inputs
- **Animations (.mp4):** NN's motion graphics can't be rebranded frame by frame. Take the message
  from the frames, build a `layout: "text"` post (or use `at` on a frame with a clean photo), and
  tell the user the animation itself isn't reused — reel 2 can recreate the idea.
- **Little clean photo** (generator warns under 420 px above NN's frame): switch to
  `layout: "text"`.
- **Variants:** suggest posting them on Facebook, or as a repost/ad test two weeks later.
