// HTML templates for every graphic, rendered to PNG by headless Chrome.
// They mirror the website: cream paper, Anton headlines, terracotta accent,
// JetBrains Mono eyebrows, the icon pattern and the logo from /public.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const pub = (p) => path.join(ROOT, "public", p);
const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString("base64")}`;

// Same split as src/styles/_fonts.scss, so Polish letters come from the latin-ext files.
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

const face = (family, file, weight, range) =>
  `@font-face{font-family:"${family}";font-weight:${weight};font-style:normal;src:url(${dataUri(
    pub(`fonts/${file}.woff2`),
    "font/woff2",
  )}) format("woff2");unicode-range:${range}}`;

const FONT_CSS = [
  face("Manrope", "manrope-latin-ext-wght-normal", "200 800", LATIN_EXT),
  face("Manrope", "manrope-latin-wght-normal", "200 800", LATIN),
  face("Anton", "anton-latin-ext-400-normal", 400, LATIN_EXT),
  face("Anton", "anton-latin-400-normal", 400, LATIN),
  face("JetBrains Mono", "jetbrains-mono-latin-ext-wght-normal", "100 800", LATIN_EXT),
  face("JetBrains Mono", "jetbrains-mono-latin-wght-normal", "100 800", LATIN),
].join("");

const LOGO = dataUri(pub("imgs/logo.png"), "image/png");
const PATTERN = dataUri(pub("pattern-icons-lg.svg"), "image/svg+xml");
const PATTERN_LIGHT = dataUri(pub("pattern-icons-lg-light.svg"), "image/svg+xml");

// --paper is the logo's own background, so the logo blends into every cream surface.
const BASE_CSS = `
:root{--paper:#f8f5ed;--ink:oklch(0.15 0.04 35);--fg:oklch(0.18 0.03 40);--terra:oklch(0.55 0.14 45);
--terra-strong:oklch(0.48 0.14 45);--muted:oklch(0.5 0.03 60);--border:oklch(0.85 0.02 70);--card:#fff}
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;background:var(--paper)}
body{position:relative;font-family:Manrope,sans-serif;color:var(--fg);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
img{display:block}
.pattern{background-image:url(${PATTERN});background-size:560px}
.display{font-family:Anton,sans-serif;font-weight:400;text-transform:uppercase;line-height:.98;letter-spacing:.004em;color:var(--ink)}
.line{display:block;width:max-content;white-space:nowrap}
.accent{color:var(--terra)}
.eyebrow{display:inline-flex;align-items:center;gap:14px;padding:13px 24px 13px 20px;border:1.5px solid var(--border);border-radius:999px;background:var(--card);font:500 19px/1 "JetBrains Mono",monospace;letter-spacing:.15em;text-transform:uppercase;color:var(--fg);white-space:nowrap}
.eyebrow svg{flex:none;color:var(--terra)}
.sub{font-size:34px;line-height:1.38;font-weight:500;color:var(--muted);text-wrap:pretty}
.sub b,.sub strong{color:var(--fg);font-weight:700}
.footnote{font:500 17px/1.4 Manrope,sans-serif;color:var(--muted)}
.cta-row{margin-top:auto;display:flex;align-items:center;gap:28px;width:100%}
.btn{display:inline-flex;align-items:center;gap:14px;background:var(--terra);color:#fff;font:700 29px/1.15 Manrope,sans-serif;padding:24px 32px;border-radius:12px;white-space:nowrap}
.cta-note{font:500 21px/1.35 Manrope,sans-serif;color:var(--muted)}
.cta-note b{display:block;color:var(--fg);font-weight:700;font-size:24px}
.tab{position:absolute;top:0;background:var(--paper);display:flex;align-items:center;z-index:2}
.tab--logo{left:0;justify-content:center;border-bottom-right-radius:38px}
.tab--logo img{height:112px;width:auto}
.tab--label{right:0;justify-content:flex-end;padding:0 32px;border-bottom-left-radius:32px;font:500 15px/1.45 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:right}
.badge{position:absolute;background:var(--paper);border-radius:22px;padding:14px 18px}
.badge img{height:78px;width:auto}
`;

// Runs in the page: shrink-to-fit helpers. Chrome takes the screenshot after they finish.
const FIT_JS = `
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const overflows = (el) => el.scrollHeight > el.clientHeight + 1;
function fitLines(el, maxW, min) {
  if (!el) return;
  let fs = parseFloat(getComputedStyle(el).fontSize);
  while (fs > min && [...el.querySelectorAll('.line')].some((l) => l.offsetWidth > maxW)) { fs -= 2; el.style.fontSize = fs + 'px'; }
}
function shrinkUntil(box, steps) {
  for (const [el, min] of steps) {
    if (!el) continue;
    let fs = parseFloat(getComputedStyle(el).fontSize);
    while (overflows(box) && fs > min) { fs -= 1; el.style.fontSize = fs + 'px'; }
  }
}
// Shows the part of a (sw x sh) photo around the focus point, cover-style, never above y0.
function placeBg(el, W, H, G, y0 = 0) {
  const s = Math.max(W / G.sw, H / (G.sh - y0));
  const vw = W / s, vh = H / s;
  const sx = clamp(G.fx * G.sw - vw / 2, 0, G.sw - vw);
  const sy = clamp(y0 + G.fy * (G.sh - y0) - vh / 2, y0, G.sh - vh);
  el.style.backgroundSize = (G.sw * s) + 'px ' + (G.sh * s) + 'px';
  el.style.backgroundPosition = (-sx * s) + 'px ' + (-sy * s) + 'px';
  return { s, sx, sy };
}
// Waits for fonts, <img>s and background photos, lays out, then tells the renderer to shoot.
function ready(fn) {
  const waits = [document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))];
  document.querySelectorAll('.photo').forEach((el) => {
    const m = getComputedStyle(el).backgroundImage.match(/url\\("?(.*?)"?\\)/);
    if (m) { const im = new Image(); im.src = m[1]; waits.push(im.decode().catch(() => {})); }
  });
  Promise.all(waits).then(() => {
    fn();
    requestAnimationFrame(() => requestAnimationFrame(() => { document.title = 'ready'; }));
  });
}
`;

function page({ w, h, body, css = "", script = "" }) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>${FONT_CSS}${BASE_CSS}html,body{width:${w}px;height:${h}px}${css}</style></head><body>${body}<script>${FIT_JS}${script}</script></body></html>`;
}

export const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Escapes text, then *words* → terracotta accent and **words** → bold. */
export const rich = (s = "") =>
  escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, '<span class="accent">$1</span>')
    .replace(/\n/g, "<br>");

/** Lucide icon (same set as the website) as inline SVG. */
export async function icon(name, { size = 48, width = 2 } = {}) {
  const file = path.join(ROOT, "node_modules/lucide-react/dist/esm/icons", `${name}.js`);
  let node;
  try {
    ({ __iconNode: node } = await import(pathToFileURL(file).href));
  } catch {
    throw new Error(`Nie ma ikony "${name}" — nazwy: https://lucide.dev/icons`);
  }
  const inner = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const headline = (lines, id = "headline", cls = "") =>
  `<h1 id="${id}" class="display headline ${cls}">${[].concat(lines).map((l) => `<span class="line">${rich(l)}</span>`).join("")}</h1>`;

const eyebrow = (label, shield) => (label ? `<span class="eyebrow">${shield}${escapeHtml(label)}</span>` : "");

const footnote = (post) => (post.footnote ? `<p class="footnote">${rich(post.footnote)}</p>` : "");

const ctaRow = (brand, post) => `
<div class="cta-row">
  <span class="btn">${rich(post.cta)}</span>
  <span class="cta-note">${escapeHtml(post.ctaNote ?? "lub zadzwoń")}<b>${escapeHtml(brand.phone)}</b></span>
</div>`;

// ------------------------------------------------------------------ post: photo
// Clean photo on top (NN's corners hidden under our logo/label tabs), cream panel below.
const POST_PHOTO_CSS = `
.photo{position:absolute;left:0;top:0;width:1080px;background-repeat:no-repeat}
.panel{position:absolute;left:0;right:0;bottom:0;background-color:var(--paper);border-radius:40px 40px 0 0;padding:50px 72px 58px;display:flex;flex-direction:column;align-items:flex-start;gap:24px;overflow:hidden;z-index:1}
.headline{font-size:100px}
`;

export function postPhoto({ brand, post, photo, shield }) {
  const G = { sw: photo.w, sh: photo.h, fx: post.focus?.[0] ?? 0.5, fy: post.focus?.[1] ?? 0.4, marks: photo.marks };
  const body = `
<div id="photo" class="photo" style="background-image:url('${photo.uri}')"></div>
<div id="logoTab" class="tab tab--logo"><img src="${LOGO}" alt=""></div>
<div id="labelTab" class="tab tab--label"><span>Materiał<br>marketingowy</span></div>
<section id="panel" class="panel pattern">
  ${eyebrow(post.label, shield)}
  ${headline(post.headline)}
  ${post.sub ? `<p id="sub" class="sub">${rich(post.sub)}</p>` : ""}
  ${footnote(post)}
  ${ctaRow(brand, post)}
</section>`;
  const script = `
const G = ${JSON.stringify(G)};
function place(P) {
  $('#photo').style.height = P + 'px';
  $('#panel').style.top = (P - 40) + 'px';
  const { s, sx, sy } = placeBg($('#photo'), 1080, P, G);
  // Tabs grow to cover NN's logo and label wherever this crop moved them.
  const map = ([x0, y0, x1, y1]) => [(x0 - sx) * s, (y0 - sy) * s, (x1 - sx) * s, (y1 - sy) * s];
  const lg = map(G.marks.logo), lb = map(G.marks.label);
  $('#logoTab').style.width = Math.max(196, lg[2] + 16) + 'px';
  $('#logoTab').style.height = Math.max(172, lg[3] + 16) + 'px';
  $('#labelTab').style.width = Math.max(250, 1080 - lb[0] + 16) + 'px';
  $('#labelTab').style.height = Math.max(92, lb[3] + 14) + 'px';
}
ready(() => {
  const panel = $('#panel'), head = $('#headline');
  // Largest photo the text allows; upscaling stops at 1.25x so the photo stays sharp.
  let P = clamp(Math.round(G.sh * 1.25), 640, ${post.maxPhoto ?? 820});
  place(P);
  fitLines(head, panel.clientWidth - 144, 56);
  while (overflows(panel) && P > 600) { P -= 10; place(P); }
  shrinkUntil(panel, [[head, 62], [$('#sub'), 25]]);
});`;
  return page({ w: 1080, h: 1350, body, css: POST_PHOTO_CSS, script });
}

// ------------------------------------------------------------------ post: text / cards
const POST_TEXT_CSS = `
.panel{position:absolute;left:0;right:0;top:0;bottom:0;padding:230px 72px 60px;display:flex;flex-direction:column;align-items:flex-start;gap:28px;overflow:hidden}
.label-plain{position:absolute;top:44px;right:56px;font:500 15px/1.45 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:right;z-index:2}
.headline{font-size:112px}
.cards{flex:1 1 auto;max-height:660px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:22px;width:100%;font-size:34px;margin:8px 0}
.card{background:var(--card);border:1.5px solid var(--border);border-radius:24px;padding:34px 32px;display:flex;flex-direction:column;justify-content:center;gap:20px;font-weight:600;line-height:1.28;color:var(--fg)}
.card svg{color:var(--terra)}
.card small{display:block;margin-top:6px;font-size:.72em;font-weight:500;color:var(--muted)}
`;

export function postText({ brand, post, shield, cardIcons = [] }) {
  const cards = (post.cards ?? [])
    .map(
      (c, i) =>
        `<div class="card">${cardIcons[i] ?? ""}<span>${rich(c.text)}${c.note ? `<small>${rich(c.note)}</small>` : ""}</span></div>`,
    )
    .join("");
  const body = `
<div class="tab tab--logo" style="width:196px;height:172px"><img src="${LOGO}" alt=""></div>
<div class="label-plain">Materiał<br>marketingowy</div>
<section id="panel" class="panel pattern">
  ${eyebrow(post.label, shield)}
  ${headline(post.headline)}
  ${cards ? `<div id="cards" class="cards">${cards}</div>` : ""}
  ${post.sub ? `<p id="sub" class="sub">${rich(post.sub)}</p>` : ""}
  ${footnote(post)}
  ${ctaRow(brand, post)}
</section>`;
  const script = `
ready(() => {
  const panel = $('#panel'), head = $('#headline');
  fitLines(head, panel.clientWidth - 144, 60);
  shrinkUntil(panel, [[head, 70], [$('#cards'), 22], [$('#sub'), 24]]);
  // Cards stretch to fill the space; if they still overflow their own box, shrink their text.
  const cards = $('#cards');
  if (cards) { let fs = parseFloat(getComputedStyle(cards).fontSize); while ([...cards.children].some(overflows) && fs > 20) { fs -= 1; cards.style.fontSize = fs + 'px'; } }
});`;
  return page({ w: 1080, h: 1350, body, css: POST_TEXT_CSS, script });
}

// ------------------------------------------------------------------ carousel: point slide
const SLIDE_CSS = `
body{background-image:url(${PATTERN});background-size:560px}
.badge{top:48px;left:56px}
.counter{position:absolute;top:78px;right:64px;font:500 22px/1 "JetBrains Mono",monospace;letter-spacing:.15em;color:var(--muted)}
.slide-body{position:absolute;left:72px;right:72px;top:210px;bottom:150px;display:flex;flex-direction:column;justify-content:center;gap:30px;overflow:hidden}
.num{font-size:170px;line-height:.9;color:var(--terra)}
.title{font-size:100px;line-height:1;text-wrap:balance}
.text{font-size:42px;line-height:1.45;font-weight:500;color:var(--muted);text-wrap:pretty}
.text b,.text strong{color:var(--fg);font-weight:700}
.slide-foot{position:absolute;left:72px;right:72px;bottom:64px;display:flex;justify-content:space-between;align-items:center;padding-top:26px;border-top:1.5px solid var(--border);font:500 20px/1 "JetBrains Mono",monospace;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
.slide-foot b{color:var(--terra);font-weight:600}
`;

const pad = (n) => String(n).padStart(2, "0");

export function slidePoint({ slide, number, index, total, label }) {
  const body = `
<div class="badge"><img src="${LOGO}" alt=""></div>
<div class="counter">${pad(index)} / ${pad(total)}</div>
<section id="panel" class="slide-body">
  <div class="num display">${pad(number)}</div>
  <h2 id="title" class="display title">${rich(slide.title)}</h2>
  <p id="text" class="text">${rich(slide.text)}</p>
</section>
<footer class="slide-foot"><span>${escapeHtml(label ?? "")}</span><b>Przesuń →</b></footer>`;
  const script = `ready(() => shrinkUntil($('#panel'), [[$('#title'), 56], [$('#text'), 27]]));`;
  return page({ w: 1080, h: 1350, body, css: SLIDE_CSS, script });
}

// ------------------------------------------------------------------ carousel: CTA slide
const CTA_CSS = `
body{background:var(--terra) url(${PATTERN_LIGHT});background-size:560px;color:var(--paper)}
.badge{top:48px;left:56px}
.counter{position:absolute;top:78px;right:64px;font:500 22px/1 "JetBrains Mono",monospace;letter-spacing:.15em;color:color-mix(in oklch,var(--paper) 75%,transparent)}
.cta-body{position:absolute;left:72px;right:72px;top:220px;bottom:190px;display:flex;flex-direction:column;justify-content:center;gap:34px;overflow:hidden}
.headline{font-size:118px;color:var(--paper)}
.headline .accent{color:var(--ink)}
.text{font-size:38px;line-height:1.42;font-weight:500;color:color-mix(in oklch,var(--paper) 92%,transparent);text-wrap:pretty}
.pill{align-self:flex-start;background:var(--paper);color:var(--ink);font:800 38px/1.15 Manrope,sans-serif;padding:30px 40px;border-radius:18px;white-space:nowrap}
.pill .accent{color:var(--terra)}
.phone{font:600 30px/1.3 Manrope,sans-serif}
.disclosure{position:absolute;left:72px;right:72px;bottom:56px;font:500 17px/1.45 Manrope,sans-serif;color:color-mix(in oklch,var(--paper) 72%,transparent)}
`;

export function slideCta({ brand, cta, index, total }) {
  const body = `
<div class="badge"><img src="${LOGO}" alt=""></div>
<div class="counter">${pad(index)} / ${pad(total)}</div>
<section id="panel" class="cta-body">
  ${headline(cta.headline)}
  ${cta.text ? `<p id="text" class="text">${rich(cta.text)}</p>` : ""}
  <span class="pill">${rich(cta.pill)}</span>
  <span class="phone">albo zadzwoń: ${escapeHtml(brand.phone)}</span>
</section>
<p class="disclosure">${escapeHtml(brand.disclosure)}</p>`;
  const script = `
ready(() => {
  const panel = $('#panel'), head = $('#headline');
  fitLines(head, panel.clientWidth, 60);
  shrinkUntil(panel, [[head, 70], [$('#text'), 26]]);
});`;
  return page({ w: 1080, h: 1350, body, css: CTA_CSS, script });
}

// ------------------------------------------------------------------ story 9:16
// The finished post on cream, room at the bottom for Instagram's link sticker.
const STORY_CSS = `
body{background-image:url(${PATTERN});background-size:560px}
.top{position:absolute;top:170px;left:0;right:0;display:flex;justify-content:center}
.shot{position:absolute;top:290px;left:100px;width:880px;height:1100px;border-radius:30px;box-shadow:0 30px 80px -20px rgba(43,26,18,.35)}
.below{position:absolute;top:1452px;left:90px;right:90px;text-align:center;font:800 46px/1.2 Manrope,sans-serif;color:var(--ink);text-wrap:balance}
.below .accent{color:var(--terra)}
`;

export function story({ postUri, story: s, shield }) {
  const body = `
<div class="top">${eyebrow(s.label, shield)}</div>
<img class="shot" src="${postUri}" alt="">
<p class="below">${rich(s.text)}</p>`;
  return page({ w: 1080, h: 1920, body, css: STORY_CSS, script: "ready(() => {});" });
}

// ------------------------------------------------------------------ blog cover 16:10
const COVER_CSS = `
.photo{position:absolute;inset:0;background-repeat:no-repeat}
.cover-text{position:absolute;inset:0;padding:70px 80px;display:flex;flex-direction:column;justify-content:center;gap:30px;background-image:url(${PATTERN});background-size:560px}
.cover-text .headline{font-size:96px}
.badge{right:56px;bottom:48px}
`;

/** Photo only — the blog page prints the title above it anyway. Skips NN's corner marks. */
export function coverPhoto({ photo, post }) {
  const G = { sw: photo.w, sh: photo.h, fx: post.focus?.[0] ?? 0.5, fy: post.focus?.[1] ?? 0.4 };
  const y0 = Math.round(photo.marks.logo[3] + 4);
  const body = `<div id="photo" class="photo" style="background-image:url('${photo.uri}')"></div>`;
  const script = `const G = ${JSON.stringify(G)};
ready(() => placeBg($('#photo'), 1200, 750, G, G.sh - ${y0} >= 380 ? ${y0} : 0));`;
  return page({ w: 1200, h: 750, body, css: COVER_CSS, script });
}

export function coverText({ post, shield }) {
  const body = `
<section id="panel" class="cover-text">
  ${eyebrow(post.label, shield)}
  ${headline(post.headline)}
</section>
<div class="badge"><img src="${LOGO}" alt=""></div>`;
  const script = `ready(() => { const p = $('#panel'), h = $('#headline'); fitLines(h, p.clientWidth - 160, 50); shrinkUntil(p, [[h, 50]]); });`;
  return page({ w: 1200, h: 750, body, css: COVER_CSS, script });
}
