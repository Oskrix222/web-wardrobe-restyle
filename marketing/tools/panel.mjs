#!/usr/bin/env node
// Bridge between content packages (marketing/posty/<folder>) and the admin panel.
//
//   node marketing/tools/panel.mjs prawdy            "Prawdy" from Panel → Prawdy (read before writing!)
//   node marketing/tools/panel.mjs plan              what's scheduled + the next free week
//   node marketing/tools/panel.mjs wyslij <folder>   upload a rendered package to Panel → Kalendarz
//                                  [--nadpisz]       also replace items already approved
//   node marketing/tools/panel.mjs pobierz           unpack ZIPs dropped into the panel into marketing/wrzuc-tutaj/<id>/
//   node marketing/tools/panel.mjs zakoncz <id> "…"  mark a ZIP as done (shown in the panel); `blad <id> "…"` for errors
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Project Settings → API Keys → secret key).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

import brand from "../brand.mjs";
import { articleHtml, campaignLinks, captionsFor, fillLink } from "./pack.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
for (const file of [".env", ".env.local"]) {
  if (existsSync(path.join(ROOT, file))) process.loadEnvFile(path.join(ROOT, file));
}

function connect() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Brak SUPABASE_SERVICE_ROLE_KEY w pliku .env.local.\n" +
        "Supabase → Project Settings → API Keys → Secret keys → skopiuj klucz i dopisz do .env.local:\n" +
        "SUPABASE_SERVICE_ROLE_KEY=sb_secret_…",
    );
    process.exit(2);
  }
  // New-style keys (sb_secret_…) are not JWTs: send them only as `apikey`.
  const apiKeyFetch = (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
  return createClient(url, key, {
    global: { fetch: apiKeyFetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function check(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

// ------------------------------------------------------------------ Polish time
const TZ = "Europe/Warsaw";

function offsetMs(date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime();
}

/** "2026-10-10" + "18:00" (Polish time) → Date. */
function warsaw(day, time) {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let ts = guess - offsetMs(new Date(guess));
  ts = guess - offsetMs(new Date(ts)); // second pass settles DST changeovers
  return new Date(ts);
}

const dayOf = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date); // YYYY-MM-DD
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const mondayOf = (day) => addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
const fmt = new Intl.DateTimeFormat("pl-PL", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026-10-10 18:00" or a {day, time} slot in the given week → Date. */
function when(value, weekStart) {
  if (typeof value === "string") {
    const [day, time = "12:00"] = value.trim().split(/\s+/);
    return warsaw(day, time);
  }
  return warsaw(addDays(weekStart, value.day - 1), value.time);
}

/** A value from Panel → Kalendarz (Plan tygodnia, autorzy…), or the fallback. */
async function setting(db, key, fallback) {
  const { data, error } = await db.from("content_settings").select("value").eq("key", key).maybeSingle();
  if (error && error.code !== "PGRST205") throw new Error(`Ustawienia: ${error.message}`);
  return data?.value ?? fallback;
}

// ------------------------------------------------------------------ prawdy
const CATEGORY = {
  o_nas: "O nas (fakty, które możesz wykorzystać w treściach)",
  oferta: "Czego nie mam w ofercie",
  ograniczenie: "Ograniczenia i wykluczenia",
  zasada: "Inne zasady",
};

async function printTruths() {
  const db = connect();
  const truths = check(
    await db.from("content_truths").select("body, category").eq("active", true).order("created_at"),
    "Prawdy",
  );
  const lines = [`# Prawdy z panelu (stan na ${dayOf(new Date())})`, ""];
  for (const [value, label] of Object.entries(CATEGORY)) {
    const list = truths.filter((t) => t.category === value);
    if (!list.length) continue;
    lines.push(`## ${label}`, ...list.map((t) => `- ${t.body}`), "");
  }
  if (!truths.length) lines.push("(lista jest pusta)");
  const text = lines.join("\n");
  writeFileSync(path.join(ROOT, "marketing/prawdy.md"), `${text}\n`);
  console.log(text);
}

// ------------------------------------------------------------------ plan
async function takenWeeks(db) {
  const rows = check(
    await db.from("content_campaigns").select("folder, title, week_start").gte("week_start", mondayOf(dayOf(new Date()))),
    "Kampanie",
  );
  return rows;
}

async function nextFreeWeek(db) {
  const taken = new Set((await takenWeeks(db)).map((c) => c.week_start));
  let week = addDays(mondayOf(dayOf(new Date())), 7);
  while (taken.has(week)) week = addDays(week, 7);
  return week;
}

async function printPlan() {
  const db = connect();
  const campaigns = (await takenWeeks(db)).sort((a, b) => a.week_start.localeCompare(b.week_start));
  const items = check(
    await db
      .from("content_items")
      .select("title, kind, scheduled_at, status, media_approved, caption_approved, campaign_id, content_campaigns(folder)")
      .gte("scheduled_at", warsaw(mondayOf(dayOf(new Date())), "00:00").toISOString())
      .order("scheduled_at"),
    "Kalendarz",
  );
  console.log("Zaplanowane tygodnie:");
  for (const c of campaigns) console.log(`  ${c.week_start}  ${c.title}  (${c.folder})`);
  if (!campaigns.length) console.log("  (brak)");
  console.log("\nNajbliższe publikacje:");
  for (const i of items.slice(0, 30)) {
    const ok = i.media_approved && i.caption_approved ? "zatwierdzone" : "czeka na Ciebie";
    console.log(`  ${fmt.format(new Date(i.scheduled_at))}  ${i.kind.padEnd(5)} ${i.status === "published" ? "opublikowane" : ok}  ${i.title}`);
  }
  console.log(`\nNastępny wolny tydzień: ${await nextFreeWeek(db)}`);
}

// ------------------------------------------------------------------ ZIPs from the panel
/** Downloads ZIPs dropped into Panel → Kalendarz and unpacks each into marketing/wrzuc-tutaj/<id>/. */
async function pullUploads() {
  const db = connect();
  const uploads = check(
    await db.from("content_uploads").select("id, file_name, path").eq("status", "new").order("created_at"),
    "Paczki",
  );
  if (!uploads.length) {
    console.log("Brak nowych ZIP-ów w panelu.");
    return;
  }
  for (const u of uploads) {
    const target = path.join(ROOT, "marketing/wrzuc-tutaj", u.id);
    mkdirSync(target, { recursive: true });
    const { data, error } = await db.storage.from("content").download(u.path);
    if (error) throw new Error(`Pobieranie ${u.file_name}: ${error.message}`);
    const zip = path.join(target, "paczka.zip");
    writeFileSync(zip, Buffer.from(await data.arrayBuffer()));
    execFileSync("ditto", ["-x", "-k", zip, target], { stdio: "pipe" });
    rmSync(zip);
    rmSync(path.join(target, "__MACOSX"), { recursive: true, force: true });
    const files = execFileSync("find", [target, "-type", "f", "(", "-iname", "*.jpg", "-o", "-iname", "*.jpeg", "-o", "-iname", "*.png", "-o", "-iname", "*.webp", "-o", "-iname", "*.mp4", "-o", "-iname", "*.mov", ")"])
      .toString()
      .trim()
      .split("\n")
      .filter(Boolean);
    check(await db.from("content_uploads").update({ status: "processing", note: null }).eq("id", u.id), "Paczki");
    console.log(`\n${u.file_name} → ${path.relative(ROOT, target)} (id ${u.id}), plików: ${files.length}`);
    for (const f of files) console.log(`  ${path.relative(ROOT, f)}`);
  }
  console.log("\nPo przygotowaniu paczek: node marketing/tools/panel.mjs zakoncz <id> \"<podsumowanie>\"");
}

async function finishUpload(id, note, failed) {
  const db = connect();
  check(
    await db.from("content_uploads").update({ status: failed ? "error" : "done", note: note || null }).eq("id", id),
    "Paczki",
  );
  console.log(`ZIP ${id}: ${failed ? "błąd" : "gotowe"}${note ? ` — ${note}` : ""}`);
}

// ------------------------------------------------------------------ wyslij
function toJpeg(png, outDir) {
  const out = path.join(outDir, `${path.basename(png, path.extname(png))}.jpg`);
  if (png.endsWith(".jpg")) return png;
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "92", png, "--out", out], { stdio: "pipe" });
  return out;
}

async function upload(db, bucket, storagePath, file) {
  check(
    await db.storage.from(bucket).upload(storagePath, readFileSync(file), {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true,
    }),
    `Wysyłanie ${path.basename(file)}`,
  );
  return db.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

const plain = (s) => s.replace(/\*+/g, "");

async function sendPackage(folderArg, { force }) {
  const dir = path.resolve(folderArg);
  const folder = path.basename(dir);
  if (!existsSync(path.join(dir, "spec.mjs")) || !existsSync(path.join(dir, "post-1.png"))) {
    throw new Error(`W ${dir} brakuje spec.mjs albo grafik — najpierw uruchom generate.mjs.`);
  }
  const spec = (await import(`${pathToFileURL(path.join(dir, "spec.mjs")).href}?t=${Date.now()}`)).default;
  const db = connect();
  const publish = spec.publish ?? {};

  // Week: explicit in the spec > the week this campaign already has > next free week.
  const existing = check(
    await db.from("content_campaigns").select("id, week_start").eq("folder", folder).maybeSingle(),
    "Kampania",
  );
  const weekStart = publish.week ? mondayOf(publish.week) : (existing?.week_start ?? (await nextFreeWeek(db)));
  // Blog authors take turns week by week (Panel → Kalendarz → Plan tygodnia).
  const authors = await setting(db, "authors", [{ name: brand.author }]);
  const { count: earlier } = await db
    .from("content_campaigns")
    .select("id", { count: "exact", head: true })
    .lt("week_start", weekStart);
  const author = spec.author ?? authors[(earlier ?? 0) % authors.length]?.name ?? brand.author;
  const campaign = check(
    await db
      .from("content_campaigns")
      .upsert(
        {
          folder,
          title: spec.topic,
          keyword: spec.keyword ?? null,
          week_start: weekStart,
          notes: spec.notes ?? [],
          author,
        },
        { onConflict: "folder" },
      )
      .select("id")
      .single(),
    "Kampania",
  );

  // Graphics → JPEG (Instagram accepts JPEG only) → public storage.
  const stamp = Date.now().toString(36);
  const work = path.join(dir, "_render", "upload");
  mkdirSync(work, { recursive: true });
  const postFiles = readdirSync(dir)
    .filter((f) => /^post-\d+\.png$/.test(f))
    .sort((a, b) => parseInt(a.slice(5), 10) - parseInt(b.slice(5), 10));
  const postMedia = [];
  for (const f of postFiles) {
    const storagePath = `${campaign.id}/${stamp}-${f.replace(".png", ".jpg")}`;
    postMedia.push({ type: "image", path: storagePath, url: await upload(db, "content", storagePath, toJpeg(path.join(dir, f), work)) });
  }
  const storyPath = `${campaign.id}/${stamp}-story.jpg`;
  const storyMedia = [{ type: "image", path: storyPath, url: await upload(db, "content", storyPath, toJpeg(path.join(dir, "story.png"), work)) }];

  const current = check(
    await db
      .from("content_items")
      .select("id, kind, position, status, media, media_approved, caption_approved")
      .eq("campaign_id", campaign.id),
    "Kalendarz",
  );
  const locked = (old) =>
    old && (old.status === "published" || ((old.media_approved || old.caption_approved) && !force));

  // Blog post as a draft — the calendar publishes it at its time.
  const { slug, link, utm } = campaignLinks(brand, spec);
  const coverUrl = await upload(db, "blog-images", `${slug}-${stamp}.jpg`, path.join(dir, "okladka-bloga.jpg"));
  const post = check(await db.from("blog_posts").select("id, status").eq("slug", slug).maybeSingle(), "Blog");
  let blogPostId = post?.id ?? null;
  if (post?.status === "published") {
    console.log(`Wpis /blog/${slug} jest już opublikowany — zostawiam go bez zmian.`);
  } else if (post && locked(current.find((c) => c.kind === "blog"))) {
    console.log(`Wpis /blog/${slug} jest już zatwierdzony — zostawiam go bez zmian.`);
  } else {
    const fields = {
      slug,
      title: spec.blog.title,
      excerpt: spec.blog.excerpt,
      content_html: articleHtml(brand, spec),
      content_json: {},
      cover_image_url: coverUrl,
      author,
      status: "draft",
    };
    const saved = check(
      post
        ? await db.from("blog_posts").update(fields).eq("id", post.id).select("id").single()
        : await db.from("blog_posts").insert(fields).select("id").single(),
      "Blog",
    );
    blogPostId = saved.id;
  }

  // Calendar items.
  const captions = captionsFor(brand, spec);
  const s = await setting(db, "schedule", brand.schedule);
  // First comment under the post and each reel: the blog link (captions can't hold links on Instagram).
  const comment = (content) =>
    `${spec.captions?.comment ?? "Cały poradnik przeczytasz tutaj 👉"} ${utm("instagram", "social", content)}`;
  const linkList = [
    { label: "Link w bio (na czas kampanii)", url: link.bio },
    { label: "Naklejka „Link” w story", url: link.story },
    { label: "Link w odpowiedzi na DM", url: link.dm },
    { label: "Wizytówka Google — przycisk „Więcej informacji”", url: link.google },
  ];
  const rows = [
    {
      kind: "blog",
      position: 0,
      title: `Wpis: ${spec.blog.title}`,
      scheduled_at: when(publish.blog ?? s.blog, weekStart),
      channels: [],
      caption: spec.blog.excerpt,
      media: [{ type: "image", url: coverUrl }],
      details: { slug },
      blog_post_id: blogPostId,
    },
    {
      kind: "post",
      position: 0,
      title: `Post: ${plain([].concat(spec.post.headline).join(" "))}`,
      scheduled_at: when(publish.post ?? s.post, weekStart),
      channels: ["instagram", "facebook"],
      caption: captions.instagram,
      first_comment: comment("post-comment"),
      media: postMedia,
      details: { alt: captions.alt, dm: captions.dm, google: captions.google, links: linkList },
    },
    {
      kind: "story",
      position: 0,
      title: "Story: link w bio",
      scheduled_at: when(publish.story ?? s.story, weekStart),
      channels: ["instagram", "facebook"],
      media: storyMedia,
      details: { linkUrl: link.story },
    },
    ...(spec.reels ?? []).map((r, i) => ({
      kind: "reel",
      position: i + 1,
      title: `Rolka ${i + 1}: ${r.title}`,
      scheduled_at: when(publish.reels?.[i] ?? s.reels[i % s.reels.length], weekStart),
      channels: ["instagram", "facebook"],
      caption: fillLink(r.caption, link.bio),
      first_comment: comment(`reel-${i + 1}`),
      media: [],
      details: {
        format: r.format,
        length: r.length,
        hook: r.hook,
        cover: r.cover,
        audio: r.audio,
        tips: r.tips,
        scenes: r.scenes,
      },
    })),
  ];

  const soon = Date.now() + 15 * 60_000;
  const report = [];
  for (const row of rows) {
    const old = current.find((c) => c.kind === row.kind && c.position === row.position);
    if (locked(old)) {
      report.push(`  pominięte (${old.status === "published" ? "opublikowane" : "już zatwierdzane"}): ${row.title}`);
      continue;
    }
    if (row.scheduled_at.getTime() < soon) {
      row.scheduled_at = new Date(Math.ceil((Date.now() + 60 * 60_000) / 600_000) * 600_000);
      report.push(`  UWAGA: termin „${row.title}” już minął — ustawiony na ${fmt.format(row.scheduled_at)}.`);
    }
    // A reel keeps the video already uploaded in the panel.
    const media = row.kind === "reel" && old?.media?.length ? old.media : row.media;
    check(
      await db.from("content_items").upsert(
        {
          campaign_id: campaign.id,
          caption: "",
          caption_facebook: "",
          ...row,
          media,
          scheduled_at: row.scheduled_at.toISOString(),
          media_approved: false,
          caption_approved: false,
          status: "pending",
          attempts: 0,
          last_error: null,
          publish_state: {},
        },
        { onConflict: "campaign_id,kind,position" },
      ),
      row.title,
    );
    // Graphics from the previous upload of this item are no longer used.
    const stale = (old?.media ?? []).filter((m) => m.path && media !== old.media).map((m) => m.path);
    if (stale.length) await db.storage.from("content").remove(stale);
    report.push(`  ${fmt.format(row.scheduled_at)}  ${row.title}`);
  }

  console.log(`Wysłane do panelu: ${spec.topic} — tydzień od ${weekStart}`);
  console.log(report.join("\n"));
  console.log(`\nZatwierdź w panelu: ${brand.site.replace(/\/$/, "")}/admin/kalendarz`);
}

// ------------------------------------------------------------------ CLI
const [command, arg, ...flags] = process.argv.slice(2);
try {
  if (command === "prawdy") await printTruths();
  else if (command === "plan") await printPlan();
  else if (command === "pobierz") await pullUploads();
  else if (command === "zakoncz" && arg) await finishUpload(arg, flags.join(" "), false);
  else if (command === "blad" && arg) await finishUpload(arg, flags.join(" "), true);
  else if (command === "wyslij" && arg) await sendPackage(arg, { force: flags.includes("--nadpisz") });
  else {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 11).join("\n"));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
