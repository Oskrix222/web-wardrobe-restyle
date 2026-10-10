// Content publisher (src/lib/content-publisher.server.ts) against an in-memory
// database and a fake Instagram/Facebook/R2. Run: npm run test:content
import { beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";

import { createFakeMeta } from "./fake-meta.mjs";
import { createFakeSupabase } from "./fake-supabase.mjs";

const ACCOUNT = {
  pageId: "PAGE1",
  pageName: "OSCare",
  pageToken: "PAGE-TOKEN",
  igUserId: "IG1",
  igUsername: "oscare.ubezpieczenia",
};

let db; // current fake database
let meta; // current fake Meta API
mock.module("@/lib/supabase-admin.server", {
  namedExports: { createAdminClient: () => db.client },
});
Object.assign(process.env, {
  R2_ACCOUNT_ID: "acct",
  R2_BUCKET: "oscare-rolki",
  R2_PUBLIC_URL: "https://pub-test.r2.dev",
  R2_ACCESS_KEY_ID: "AK",
  R2_SECRET_ACCESS_KEY: "SK",
});
const { runPublisher, replyPacing } = await import("@/lib/content-publisher.server");
// Real pauses are 30+ s; the tests only check the order and the limits.
Object.assign(replyPacing, { minCommentAgeMs: [0, 0], gapMs: [0, 0], dmToPublicMs: [0, 0] });

const minutes = (m) => new Date(Date.now() + m * 60_000).toISOString();
const BLOG_LINK = "https://oscare.example/blog/rak?utm_source=instagram&utm_content=post-comment";

function item(fields) {
  return {
    id: fields.id,
    campaign_id: "c1",
    position: 0,
    title: fields.id,
    channels: ["instagram", "facebook"],
    caption: `Opis ${fields.id}. Napisz „RAK” w komentarzu, a podeślemy Ci ofertę.`,
    caption_facebook: "",
    first_comment: "",
    media: [],
    details: {},
    blog_post_id: null,
    media_approved: true,
    caption_approved: true,
    status: "pending",
    publish_state: {},
    attempts: 0,
    last_error: null,
    locked_until: null,
    published_at: null,
    scheduled_at: minutes(-30),
    ...fields,
  };
}

/** One approved week that is due now. */
function week(overrides = {}) {
  const images = [1, 2].map((i) => ({ type: "image", url: `https://img.example/post-${i}.jpg` }));
  return {
    content_integrations: [{ provider: "meta", data: ACCOUNT }],
    content_campaigns: [
      { id: "c1", keyword: "RAK", week_start: "2026-10-12", folder: "rak", title: "Rak" },
    ],
    blog_posts: [
      { id: "b1", slug: "ubezpieczenie-na-wypadek-raka", status: "draft", published_at: null },
    ],
    content_items: [
      item({
        id: "blog",
        kind: "blog",
        channels: [],
        blog_post_id: "b1",
        scheduled_at: minutes(-60),
      }),
      item({
        id: "post",
        kind: "post",
        media: images,
        first_comment: `Cały poradnik 👉 ${BLOG_LINK}`,
      }),
      item({ id: "story", kind: "story", media: [images[0]] }),
      item({
        id: "reel-long",
        kind: "reel",
        position: 1,
        first_comment: `Poradnik 👉 ${BLOG_LINK}`,
        media: [
          {
            type: "video",
            url: "https://pub-test.r2.dev/rolki/r1.mp4",
            path: "r2:rolki/r1.mp4",
            duration: 95,
          },
        ],
      }),
      item({
        id: "reel-short",
        kind: "reel",
        position: 2,
        media: [
          {
            type: "video",
            url: "https://fake.supabase.co/r2.mp4",
            path: "c1/reel-2.mp4",
            duration: 40,
          },
        ],
      }),
      item({ id: "reel-unapproved", kind: "reel", position: 3, media_approved: false }),
      item({
        id: "post-future",
        kind: "post",
        campaign_id: "c2",
        media: images,
        scheduled_at: minutes(60 * 24),
      }),
    ],
    ...overrides,
  };
}

const byId = (id) => db.tables.content_items.find((i) => i.id === id);

beforeEach(() => {
  meta = createFakeMeta(ACCOUNT);
  globalThis.fetch = meta.fetch;
});

test("publishes an approved week: blog on the site, posts/stories/reels on Instagram and Facebook", async () => {
  db = createFakeSupabase(week());
  const report = await runPublisher();

  assert.deepEqual(report.errors, []);
  for (const id of ["blog", "post", "story", "reel-long", "reel-short"]) {
    assert.equal(byId(id).status, "published", `${id} should be published`);
    assert.ok(byId(id).published_at, `${id} gets a publication date`);
  }
  assert.equal(db.tables.blog_posts[0].status, "published");
  assert.equal(byId("blog").details.url, "/blog/ubezpieczenie-na-wypadek-raka");

  // Instagram: a 2-image carousel with the caption on the carousel container.
  const containers = meta.graph("POST", "media").map((c) => c.params);
  assert.equal(containers.filter((p) => p.is_carousel_item === "true").length, 2);
  const carousel = containers.find((p) => p.media_type === "CAROUSEL");
  assert.equal(carousel.caption, byId("post").caption);
  assert.ok(containers.some((p) => p.media_type === "STORIES"));
  assert.equal(containers.filter((p) => p.media_type === "REELS").length, 2);

  // Facebook: the same caption, but "comment RAK" (engagement bait there) becomes an
  // invitation to write; photo post, story, reel ≤ 90 s, video > 90 s.
  const feed = meta.graph("POST", "feed")[0].params;
  assert.equal(
    feed.message,
    "Opis post. Chcesz ofertę? Napisz do nas wiadomość albo zadzwoń: +48 539 075 385.",
  );
  assert.equal(Object.keys(feed).filter((k) => k.startsWith("attached_media")).length, 2);
  assert.equal(meta.graph("POST", "photo_stories").length, 1);
  assert.equal(meta.graph("POST", "videos").length, 1, "95 s reel goes to Facebook as a video");
  assert.equal(meta.graph("POST", "video_reels").length, 2, "40 s reel: start + finish");
  assert.ok(meta.calls.some((c) => c.host === "rupload" && c.headers.file_url.endsWith("r2.mp4")));

  // First comment with the blog link under the post and the long reel, on both networks.
  const comments = meta.graph("POST", "comments").map((c) => c.path);
  assert.ok(comments.includes(`${byId("post").publish_state.instagram.id}/comments`));
  assert.ok(comments.includes(`${byId("post").publish_state.facebook.id}/comments`));
  assert.ok(comments.includes(`${byId("reel-long").publish_state.facebook.id}/comments`));
  assert.equal(comments.length, 4, "post ×2 + reel-long ×2; story and reel without text get none");
  assert.equal(byId("post").publish_state.instagram.commented, true);

  // The R2 video is deleted once both networks have it; the Supabase one is left alone.
  const deletes = meta.calls.filter((c) => c.host === "r2" && c.method === "DELETE");
  assert.deepEqual(
    deletes.map((d) => d.path),
    ["/oscare-rolki/rolki/r1.mp4"],
  );

  // Untouched: not approved, not due yet.
  assert.equal(byId("reel-unapproved").status, "pending");
  assert.equal(byId("post-future").status, "pending");
  assert.equal(byId("post-future").publish_state.instagram, undefined);

  // Heartbeat for Panel → Połączenia.
  const cron = db.tables.content_integrations.find((r) => r.provider === "cron");
  assert.equal(cron.data.published.length, 5);
});

test("social posts wait while the campaign's blog post isn't published", async () => {
  const data = week();
  data.content_items.find((i) => i.id === "blog").media_approved = false;
  db = createFakeSupabase(data);
  await runPublisher();

  assert.equal(byId("post").status, "pending");
  assert.match(byId("post").publish_state.waiting, /wpisu na blogu/);
  assert.equal(meta.calls.filter((c) => c.host === "graph").length, 0, "nothing sent to Meta");
});

test("a failed Facebook step is retried later without posting twice on Instagram", async () => {
  db = createFakeSupabase(week());
  meta.failures.set("POST PAGE1/feed", "Facebook chwilowo niedostępny");
  await runPublisher();

  const post = byId("post");
  assert.equal(post.status, "pending");
  assert.equal(post.attempts, 1);
  assert.match(post.last_error, /chwilowo niedostępny/);
  assert.equal(post.publish_state.instagram.done, true);
  assert.equal(post.locked_until, null, "lock released after the error");

  meta.failures.clear();
  const publishesBefore = meta.graph("POST", "media_publish").length;
  await runPublisher();
  assert.equal(byId("post").status, "published");
  assert.equal(
    meta.graph("POST", "media_publish").length,
    publishesBefore,
    "Instagram not published again",
  );
});

test("after 4 failed attempts an item is marked as failed", async () => {
  db = createFakeSupabase(week());
  meta.failures.set("POST PAGE1/feed", "Odrzucone");
  for (let i = 0; i < 4; i++) await runPublisher();
  assert.equal(byId("post").status, "failed");
  assert.equal(byId("post").attempts, 4);
});

test("a reel still processing on Instagram is finished by the next run", async () => {
  db = createFakeSupabase(week());
  // Every reel container stays IN_PROGRESS during the first run.
  const realFetch = meta.fetch;
  globalThis.fetch = async (input, init) => {
    const res = await realFetch(input, init);
    const url = new URL(String(input));
    if (
      url.pathname.includes("reels-container") &&
      url.searchParams.get("fields")?.startsWith("status_code")
    ) {
      return Response.json({ status_code: "IN_PROGRESS" });
    }
    return res;
  };
  // Don't wait the real 60 s for Instagram inside the test.
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn) => realSetTimeout(fn, 0);
  const realNow = Date.now;
  let fakeNow = realNow();
  Date.now = () => (fakeNow += 10_000);
  try {
    await runPublisher();
  } finally {
    globalThis.setTimeout = realSetTimeout;
    Date.now = realNow;
  }
  assert.equal(byId("reel-short").status, "publishing");
  assert.ok(byId("reel-short").publish_state.instagram.containerId);

  globalThis.fetch = meta.fetch;
  await runPublisher();
  assert.equal(byId("reel-short").status, "published");
  assert.equal(
    meta.graph("POST", "media").filter((c) => c.params.media_type === "REELS").length,
    2,
    "no second container for the same reel",
  );
});

test("without a Meta connection nothing is posted and no attempt is used up", async () => {
  db = createFakeSupabase(week({ content_integrations: [] }));
  await runPublisher();
  assert.equal(byId("blog").status, "published", "the blog doesn't need Meta");
  assert.equal(byId("post").status, "pending");
  assert.equal(byId("post").attempts, 0);
  assert.match(byId("post").last_error, /Połączenia/);
});

test("'Opublikuj teraz' ignores the date but still needs both approvals", async () => {
  db = createFakeSupabase(week());
  byId("post-future").campaign_id = "c1";
  await runPublisher({ itemId: "blog" });
  await runPublisher({ itemId: "post-future" });
  assert.equal(byId("post-future").status, "published");

  await runPublisher({ itemId: "reel-unapproved" });
  assert.equal(byId("reel-unapproved").status, "pending");
});

test("keyword comments get one private message and a public answer, never twice", async () => {
  db = createFakeSupabase(
    week({
      content_settings: [
        {
          key: "auto_reply",
          value: {
            instagram: {
              enabled: true,
              message: "Cześć {imie}! Oferta „{slowo}”: {link}",
              publicReply: "Wysłane 📩",
            },
            facebook: { enabled: true, message: "Dzień dobry {imie}, {link}", publicReply: "" },
          },
        },
      ],
    }),
  );
  await runPublisher(); // publish first

  const post = byId("post");
  meta.comments[post.publish_state.instagram.id] = [
    { id: "k1", text: "Rak, poproszę 🙏", username: "ania", from: { id: "u1" } },
    { id: "k2", text: "rakieta 🚀", username: "ola", from: { id: "u2" } },
    { id: "k3", text: "RAK", username: ACCOUNT.igUsername, from: { id: ACCOUNT.igUserId } },
  ];
  meta.comments[post.publish_state.facebook.id] = [
    { id: "f1", message: "rak!", from: { id: "u9", name: "Jan Kowalski" } },
  ];

  const report = await runPublisher();
  assert.equal(report.replies, 2);

  const messages = meta.graph("POST", "messages");
  assert.equal(messages.length, 2);
  const ig = messages.find((m) => m.path === "IG1/messages").params;
  assert.deepEqual(JSON.parse(ig.recipient), { comment_id: "k1" });
  assert.equal(JSON.parse(ig.message).text, `Cześć ania! Oferta „RAK”: ${BLOG_LINK}`);
  const fb = messages.find((m) => m.path === "PAGE1/messages").params;
  assert.equal(JSON.parse(fb.message).text, `Dzień dobry Jan Kowalski, ${BLOG_LINK}`);

  assert.equal(
    meta.graph("POST", "replies").length,
    1,
    "public answer only on Instagram (Facebook text empty)",
  );
  assert.deepEqual(
    db.tables.content_replies.map((r) => [r.platform, r.comment_id, r.status]).sort(),
    [
      ["facebook", "f1", "sent"],
      ["instagram", "k1", "sent"],
    ],
  );

  await runPublisher();
  assert.equal(meta.graph("POST", "messages").length, 2, "nobody gets a second message");
});

test("a failed private reply is logged and not retried in a loop", async () => {
  db = createFakeSupabase(
    week({
      content_settings: [
        {
          key: "auto_reply",
          value: {
            instagram: { enabled: true, message: "Hej {imie}", publicReply: "" },
            facebook: { enabled: false, message: "", publicReply: "" },
          },
        },
      ],
    }),
  );
  await runPublisher();
  meta.comments[byId("post").publish_state.instagram.id] = [
    { id: "k1", text: "RAK", username: "ania" },
  ];
  meta.failures.set("POST IG1/messages", "Brak uprawnień (App Review)");
  await runPublisher();
  const row = db.tables.content_replies.find((r) => r.comment_id === "k1");
  assert.equal(row.status, "failed");
  assert.match(row.error, /App Review/);
  await runPublisher();
  assert.equal(meta.graph("POST", "messages").length, 1);
});

test("auto replies stay off when both switches are off", async () => {
  db = createFakeSupabase(week());
  await runPublisher();
  meta.comments[byId("post").publish_state.instagram.id] = [
    { id: "k1", text: "RAK", username: "ania" },
  ];
  await runPublisher();
  assert.equal(meta.graph("POST", "messages").length, 0);
  assert.equal(meta.graph("GET", "comments").length, 0, "comments aren't even fetched");
});

test("downloads from Supabase count toward the monthly limit; at the limit publishing waits", async () => {
  db = createFakeSupabase(week());
  await runPublisher();
  // post: 2 images × 2 networks, story: 1 × 2, reel-short (Supabase): 1 × 2; the R2 reel is free.
  const usage = db.tables.content_integrations.find((r) => r.provider === "usage").data;
  assert.equal(usage.bytes, (4 + 2 + 2) * 500_000);

  const month = usage.month;
  db = createFakeSupabase(
    week({
      content_integrations: [
        { provider: "meta", data: ACCOUNT },
        { provider: "usage", data: { month, bytes: 9 * 1024 ** 3 - 100 } },
      ],
    }),
  );
  meta = createFakeMeta(ACCOUNT);
  globalThis.fetch = meta.fetch;
  await runPublisher();
  assert.equal(byId("blog").status, "published", "the blog itself moves no files");
  assert.equal(byId("reel-long").status, "published", "reels from R2 are free");
  for (const id of ["post", "story", "reel-short"]) {
    assert.equal(byId(id).status, "pending", `${id} waits for next month`);
    assert.equal(byId(id).attempts, 0, "waiting doesn't use up attempts");
    assert.match(byId(id).publish_state.waiting, /Miesięczny limit transferu/);
  }
  assert.equal(meta.graph("POST", "feed").length, 0, "nothing posted on Facebook");
});

test("keyword replies: at most 5 people per 10 minutes, fresh comments wait", async () => {
  db = createFakeSupabase(
    week({
      content_settings: [
        {
          key: "auto_reply",
          value: {
            instagram: { enabled: true, message: "Hej {imie}", publicReply: "" },
            facebook: { enabled: false, message: "", publicReply: "" },
          },
        },
      ],
    }),
  );
  await runPublisher();
  const old = new Date(Date.now() - 5 * 60_000).toISOString();
  meta.comments[byId("post").publish_state.instagram.id] = [
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`,
      text: "RAK",
      username: `u${i}`,
      timestamp: old,
    })),
    { id: "fresh", text: "RAK", username: "nowa", timestamp: new Date().toISOString() },
    {
      id: "expired",
      text: "RAK",
      username: "stara",
      timestamp: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    },
  ];
  const saved = { ...replyPacing };
  Object.assign(replyPacing, { minCommentAgeMs: [30_000, 33_000] });
  try {
    await runPublisher();
    const first = meta.graph("POST", "messages").length;
    assert.ok(first >= 4 && first <= 5, `4–5 people in the first window, got ${first}`);
    await runPublisher();
    assert.ok(
      meta.graph("POST", "messages").length <= 5,
      "a second run in the same 10 minutes never goes above 5 people",
    );
    const answered = meta
      .graph("POST", "messages")
      .map((m) => JSON.parse(m.params.recipient).comment_id);
    assert.ok(!answered.includes("fresh"), "a comment younger than 30 s waits");
    assert.ok(!answered.includes("expired"), "older than 7 days: Meta doesn't allow a reply");
  } finally {
    Object.assign(replyPacing, saved);
  }
});
