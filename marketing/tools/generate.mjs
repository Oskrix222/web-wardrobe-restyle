#!/usr/bin/env node
// Builds one post package from <folder>/spec.mjs: graphics + paczka.html.
// Usage: node marketing/tools/generate.mjs marketing/posty/<folder>
// Needs only what the Mac already has: Node, ffmpeg and Google Chrome.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import brand from "../brand.mjs";
import { cropRows, fillRects, findFrameTop, nnMarks, readImage, writeImage } from "./image.mjs";
import { buildPack } from "./pack.mjs";
import { startBrowser } from "./render.mjs";
import * as T from "./templates.mjs";

const dir = path.resolve(process.argv[2] ?? "");
if (!existsSync(path.join(dir, "spec.mjs"))) {
  console.error("Użycie: node marketing/tools/generate.mjs <folder ze spec.mjs>");
  process.exit(1);
}
const spec = (await import(`${pathToFileURL(path.join(dir, "spec.mjs")).href}?t=${Date.now()}`)).default;

const work = path.join(dir, "_render");
mkdirSync(work, { recursive: true });
const files = [];
const warnings = [];
const browser = await startBrowser();

async function shoot(html, png, w, h) {
  const htmlFile = path.join(work, `${path.basename(png, ".png")}.html`);
  writeFileSync(htmlFile, html);
  await browser.shoot(htmlFile, png, w, h);
  return png;
}

async function output(html, name, w, h, label) {
  await shoot(html, path.join(dir, `${name}.png`), w, h);
  files.push({ file: `${name}.png`, label });
}

// Clean photo = everything above NN's orange frame, with NN's logo and label painted out.
function preparePhoto(g, name) {
  const img = readImage(path.resolve(dir, g.source), { at: g.at });
  const k = img.w / 1080;
  const frameTop = g.cleanBottom ?? findFrameTop(img);
  const clean = frameTop ? frameTop - Math.round(14 * k) : img.h;
  const marks = nnMarks(k);
  if (frameTop || g.nn) fillRects(img, [marks.logo, marks.label]);
  if (clean < 420 * k) {
    warnings.push(`${g.source}: tylko ${clean}px czystego zdjęcia nad ramką NN — lepszy będzie layout "text".`);
  }
  const file = path.join(work, `${name}.png`);
  writeImage(cropRows(img, 0, clean), file);
  return { uri: pathToFileURL(file).href, w: img.w, h: clean, marks };
}

const shield = await T.icon("shield", { size: 22, width: 2.2 });
const defaults = { cta: `Napisz „${spec.keyword}” w komentarzu`, label: spec.label };
// Variants reuse the main post's texts but never its photo settings.
const PHOTO_FIELDS = new Set(["source", "at", "focus", "cleanBottom", "nn", "layout"]);
const postTexts = Object.fromEntries(Object.entries(spec.post).filter(([k]) => !PHOTO_FIELDS.has(k)));

// 1. Main graphic (+ alternative versions of the same message).
let mainPhoto = null;
for (const [i, g0] of [spec.post, ...(spec.variants ?? [])].entries()) {
  const g = i === 0 ? { ...defaults, ...spec.post } : { ...defaults, ...postTexts, ...g0 };
  const name = i === 0 ? "post-1" : `wariant-${i + 1}`;
  const label = i === 0 ? "Grafika główna (slajd 1)" : `Wariant ${i + 1}: ta sama treść, inne zdjęcie`;
  if (g.layout === "text") {
    const cardIcons = await Promise.all((g.cards ?? []).map((c) => T.icon(c.icon ?? "check", { size: 54, width: 1.8 })));
    await output(T.postText({ brand, post: g, shield, cardIcons }), name, 1080, 1350, label);
  } else {
    const photo = preparePhoto(g, `${name}-zdjecie`);
    if (i === 0) mainPhoto = photo;
    await output(T.postPhoto({ brand, post: g, photo, shield }), name, 1080, 1350, label);
  }
}

// 2. Carousel: point slides + closing CTA slide.
const points = spec.carousel ?? [];
if (points.length) {
  const total = points.length + 2;
  for (const [i, slide] of points.entries()) {
    await output(
      T.slidePoint({ slide, number: i + 1, index: i + 2, total, label: spec.post.label ?? spec.label }),
      `post-${i + 2}`,
      1080,
      1350,
      `Karuzela: slajd ${i + 2}`,
    );
  }
  const cta = {
    headline: ["Sprawdźmy", "*Twoją* ochronę"],
    text: "Odpiszę w 24 h z konkretami. Bez zobowiązań i bez drobnego druku.",
    pill: `Napisz *„${spec.keyword}”* w komentarzu`,
    ...spec.carouselCta,
  };
  await output(T.slideCta({ brand, cta, index: total, total }), `post-${total}`, 1080, 1350, "Karuzela: slajd końcowy (CTA)");
}

// 3. Story with room for the link sticker.
await output(
  T.story({
    postUri: pathToFileURL(path.join(dir, "post-1.png")).href,
    story: { label: "Nowy poradnik", text: "Cały poradnik na blogu: *kliknij link* ↓", ...spec.story },
    shield,
  }),
  "story",
  1080,
  1920,
  "Story: naklejkę z linkiem połóż pod tekstem",
);

// 4. Blog cover (JPG — lighter on the website).
const coverPng = await shoot(
  mainPhoto ? T.coverPhoto({ photo: mainPhoto, post: spec.post }) : T.coverText({ post: { ...defaults, ...spec.post }, shield }),
  path.join(work, "okladka-bloga.png"),
  1200,
  750,
);
execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "86", coverPng, "--out", path.join(dir, "okladka-bloga.jpg")], {
  stdio: "pipe",
});
files.push({ file: "okladka-bloga.jpg", label: "Okładka wpisu na blogu" });

// 5. Copy-paste page, with small previews baked in so it works wherever it's opened.
for (const f of files) {
  const jpg = execFileSync("ffmpeg", ["-v", "error", "-i", path.join(dir, f.file), "-vf", "scale=360:-2", "-q:v", "4", "-f", "mjpeg", "-"], {
    maxBuffer: 1 << 26,
  });
  f.thumb = `data:image/jpeg;base64,${jpg.toString("base64")}`;
}
writeFileSync(path.join(dir, "paczka.html"), buildPack({ brand, spec, files, dir }));
await browser.close();

console.log(`Gotowe: ${path.join(dir, "paczka.html")}`);
for (const f of files) console.log(`  ${f.file.padEnd(20)} ${f.label}`);
for (const w of warnings) console.warn(`UWAGA: ${w}`);
