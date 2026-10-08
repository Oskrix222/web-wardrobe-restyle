// marketing/tools/panel.mjs (Claude Code ↔ panel bridge) against an in-memory database,
// using the real rendered package in marketing/tools/fixtures… or the demo package.
import { after, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createFakeSupabase } from "./fake-supabase.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PANEL = pathToFileURL(path.join(ROOT, "marketing/tools/panel.mjs")).href;
const DEMO = path.join(ROOT, "marketing/posty/2026-10-10-zdrowie-psychiczne");
const TMP = mkdtempSync(path.join(os.tmpdir(), "oscare-panel-test-"));

let db;
mock.module("@supabase/supabase-js", { namedExports: { createClient: () => db.client } });
process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";

let run = 0;
/** Runs the CLI in-process and returns what it printed. */
async function panel(...args) {
  const output = [];
  const log = console.log;
  const error = console.error;
  console.log = (...a) => output.push(a.join(" "));
  console.error = (...a) => output.push(a.join(" "));
  process.argv = [process.execPath, "panel.mjs", ...args];
  try {
    await import(`${PANEL}?run=${++run}`);
  } finally {
    console.log = log;
    console.error = error;
  }
  const code = process.exitCode ?? 0;
  process.exitCode = 0;
  return { code, text: output.join("\n") };
}

const warsaw = (iso) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
const day = (d) => d.toISOString().slice(0, 10);
const thisMonday = () => {
  const d = new Date(
    `${new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(new Date())}T12:00:00Z`,
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
};
const plusDays = (d, n) => new Date(d.getTime() + n * 86_400_000);

/** The demo package without its fixed dates, so the panel's week plan applies. */
function packageCopy() {
  const dir = path.join(TMP, "2026-10-19-test-pakiet");
  rmSync(dir, { recursive: true, force: true });
  cpSync(DEMO, dir, { recursive: true, filter: (src) => !src.includes("_render") });
  const spec = readFileSync(path.join(dir, "spec.mjs"), "utf8").replace(
    /\n  publish: \{[\s\S]*?\n  \},\n/,
    "\n",
  );
  writeFileSync(path.join(dir, "spec.mjs"), spec);
  return dir;
}

const SCHEDULE = {
  blog: { day: 1, time: "06:30" },
  post: { day: 4, time: "20:15" },
  story: { day: 4, time: "21:00" },
  reels: [
    { day: 2, time: "18:00" },
    { day: 3, time: "18:00" },
    { day: 5, time: "17:45" },
  ],
};

beforeEach(() => {
  db = createFakeSupabase({
    content_settings: [
      { key: "schedule", value: SCHEDULE },
      {
        key: "authors",
        value: [
          { name: "Oskar Kubowicz", phone: "+48 539 075 385" },
          { name: "Izumi Sato", phone: "+48 123 456 789" },
        ],
      },
    ],
    // Next week is already taken → the package must land the week after.
    content_campaigns: [
      {
        id: "taken",
        folder: "inny-temat",
        title: "Inny",
        week_start: day(plusDays(thisMonday(), 7)),
      },
    ],
  });
});

after(() => rmSync(TMP, { recursive: true, force: true }));

test("wyslij: next free week, the panel's week plan, alternating author, links in first comments", async () => {
  assert.ok(
    existsSync(path.join(DEMO, "post-1.png")),
    "demo package must be rendered (generate.mjs)",
  );
  const dir = packageCopy();
  const { code, text } = await panel("wyslij", dir);
  assert.equal(code, 0, text);

  const campaign = db.tables.content_campaigns.find((c) => c.folder === path.basename(dir));
  assert.equal(campaign.week_start, day(plusDays(thisMonday(), 14)));
  assert.equal(campaign.keyword, "WSPARCIE");
  assert.equal(campaign.author, "Izumi Sato", "second campaign → second author");

  const items = db.tables.content_items.filter((i) => i.campaign_id === campaign.id);
  const get = (kind, position = 0) => items.find((i) => i.kind === kind && i.position === position);
  assert.equal(items.length, 6);
  assert.match(warsaw(get("blog").scheduled_at), /poniedziałek.*06:30/);
  assert.match(warsaw(get("post").scheduled_at), /czwartek.*20:15/);
  assert.match(warsaw(get("story").scheduled_at), /czwartek.*21:00/);
  assert.match(warsaw(get("reel", 3).scheduled_at), /piątek.*17:45/);

  const post = get("post");
  assert.deepEqual(post.channels, ["instagram", "facebook"]);
  assert.equal(post.media.length, 5);
  assert.ok(
    post.media.every((m) => m.url.endsWith(".jpg")),
    "Instagram needs JPEG",
  );
  assert.match(post.caption, /Napisz „WSPARCIE” w komentarzu/);
  assert.match(post.caption, /#OSCare/);
  assert.match(post.first_comment, /utm_content=post-comment/);
  assert.match(post.first_comment, /\/blog\/ubezpieczenie-zdrowia-psychicznego/);
  assert.equal(post.caption_facebook, "", "Facebook gets the same caption");
  assert.deepEqual(get("story").channels, ["instagram", "facebook"]);
  for (const n of [1, 2, 3]) {
    const reel = get("reel", n);
    assert.deepEqual(reel.channels, ["instagram", "facebook"]);
    assert.match(reel.first_comment, new RegExp(`utm_content=reel-${n}`));
    assert.ok(reel.details.scenes.length >= 4);
    assert.equal(reel.media_approved, false);
  }

  const blog = db.tables.blog_posts[0];
  assert.equal(blog.status, "draft");
  assert.equal(blog.author, "Izumi Sato");
  assert.match(blog.content_html, /Materiał marketingowy/);
  assert.equal(get("blog").blog_post_id, blog.id);
});

test("wyslij twice: updates in place, no duplicates, old graphics removed", async () => {
  const dir = packageCopy();
  await panel("wyslij", dir);
  const imagesAfterFirst = Object.keys(db.storage).filter((k) => k.startsWith("content/")).length;
  await panel("wyslij", dir);
  assert.equal(db.tables.content_campaigns.length, 2);
  assert.equal(db.tables.content_items.length, 6);
  assert.equal(db.tables.blog_posts.length, 1);
  assert.equal(
    Object.keys(db.storage).filter((k) => k.startsWith("content/")).length,
    imagesAfterFirst,
    "replaced graphics are deleted from storage",
  );
  assert.equal(
    Object.keys(db.storage).filter((k) => k.startsWith("blog-images/")).length,
    1,
    "only the current blog cover is kept",
  );
});

test("wyslij keeps what the admin already approved", async () => {
  const dir = packageCopy();
  await panel("wyslij", dir);
  const post = db.tables.content_items.find((i) => i.kind === "post");
  post.caption = "Poprawione przez Oskara";
  post.media_approved = true;
  const blogItem = db.tables.content_items.find((i) => i.kind === "blog");
  blogItem.media_approved = blogItem.caption_approved = true;
  db.tables.blog_posts[0].title = "Tytuł poprawiony w edytorze";

  const { text } = await panel("wyslij", dir);
  assert.match(text, /pominięte/);
  assert.equal(post.caption, "Poprawione przez Oskara");
  assert.equal(db.tables.blog_posts[0].title, "Tytuł poprawiony w edytorze");
  assert.equal(
    Object.keys(db.storage).filter((k) => k.startsWith("blog-images/")).length,
    1,
    "no new cover uploaded for an approved post",
  );
});

test("pobierz + zakoncz: ZIP from the panel is unpacked for Claude and marked done", async () => {
  const src = path.join(TMP, "zip-src", "Grafiki 3");
  mkdirSync(src, { recursive: true });
  cpSync(path.join(DEMO, "post-1.png"), path.join(src, "Ubezpieczenie domu.png"));
  writeFileSync(path.join(src, "Thumbs.db"), "x");
  const zip = path.join(TMP, "grafiki.zip");
  execFileSync("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", src, zip]);
  db.storage["content/uploads/u1.zip"] = readFileSync(zip);
  db.tables.content_uploads = [
    { id: "u1", file_name: "grafiki.zip", path: "uploads/u1.zip", status: "new" },
  ];

  const target = path.join(ROOT, "marketing/wrzuc-tutaj/u1");
  try {
    const { code, text } = await panel("pobierz");
    assert.equal(code, 0, text);
    assert.equal(db.tables.content_uploads[0].status, "processing");
    assert.equal(
      db.storage["content/uploads/u1.zip"],
      undefined,
      "ZIP removed from storage after unpacking",
    );
    assert.ok(existsSync(path.join(target, "Grafiki 3", "Ubezpieczenie domu.png")));
    assert.match(text, /Ubezpieczenie domu\.png/);
    assert.doesNotMatch(text, /Thumbs\.db/, "only graphics are listed");
    assert.ok(!readdirSync(target).includes("__MACOSX"));

    await panel("zakoncz", "u1", "2 tygodnie od 19.10");
    assert.equal(db.tables.content_uploads[0].status, "done");
    assert.equal(db.tables.content_uploads[0].note, "2 tygodnie od 19.10");
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test("prawdy: only active truths, grouped, 'O nas' first", async () => {
  const cache = path.join(ROOT, "marketing/prawdy.md");
  const previous = existsSync(cache) ? readFileSync(cache, "utf8") : null;
  db.tables.content_truths = [
    { body: "Nie mam w ofercie OC/AC.", category: "oferta", active: true, created_at: "1" },
    { body: "W branży od 2005 roku.", category: "o_nas", active: true, created_at: "2" },
    { body: "Stara zasada.", category: "zasada", active: false, created_at: "3" },
  ];
  try {
    const { text } = await panel("prawdy");
    assert.ok(text.indexOf("W branży od 2005") < text.indexOf("Nie mam w ofercie"));
    assert.match(text, /## O nas/);
    assert.doesNotMatch(text, /Stara zasada/);
  } finally {
    if (previous === null) rmSync(cache, { force: true });
    else writeFileSync(cache, previous);
  }
});
