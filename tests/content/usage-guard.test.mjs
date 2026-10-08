// Hard limits (src/lib/usage-guard.server.ts): per-file sizes, storage caps and the
// 9 GB monthly transfer counter — so a misclick can never cost money.
import { beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";

import { createFakeSupabase } from "./fake-supabase.mjs";

const MB = 1024 * 1024;
const GB = 1024 * MB;

let db;
let r2Objects; // sizes of files "in R2"
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
const { reserveUpload, countTransfer, monthlyUsage, currentMonth, supabaseStoredBytes, LIMITS } =
  await import("@/lib/usage-guard.server");
const { r2StoredBytes } = await import("@/lib/r2.server");

// R2 ListObjectsV2, two pages so pagination is exercised.
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  assert.equal(url.hostname, "acct.r2.cloudflarestorage.com");
  assert.equal(url.pathname, "/oscare-rolki");
  assert.equal(url.searchParams.get("list-type"), "2");
  assert.ok(url.searchParams.get("X-Amz-Signature"));
  const page = url.searchParams.get("continuation-token") === "next" ? 1 : 0;
  const half = Math.ceil(r2Objects.length / 2);
  const sizes = page ? r2Objects.slice(half) : r2Objects.slice(0, half);
  const contents = sizes.map(
    (s, i) => `<Contents><Key>rolki/${page}-${i}.mp4</Key><Size>${s}</Size></Contents>`,
  );
  const more = page === 0 && r2Objects.length > 1;
  return new Response(
    `<ListBucketResult>${contents.join("")}<IsTruncated>${more}</IsTruncated>` +
      (more ? "<NextContinuationToken>next</NextContinuationToken>" : "") +
      "</ListBucketResult>",
  );
};

const usageRow = () => db.tables.content_integrations?.find((r) => r.provider === "usage")?.data;

beforeEach(() => {
  db = createFakeSupabase();
  r2Objects = [];
});

test("R2 storage is summed across every page of the listing", async () => {
  r2Objects = [100, 200, 300];
  assert.equal(await r2StoredBytes(), 600);
});

test("a reel goes to R2 and is refused when R2 would pass 9 GB", async () => {
  r2Objects = [4 * GB, 4 * GB];
  assert.deepEqual(await reserveUpload(db.client, "reel", 200 * MB), { store: "r2" });
  await assert.rejects(reserveUpload(db.client, "reel", 1.5 * GB), /Plik ma 1536 MB/);
  r2Objects = [4 * GB, 4.9 * GB].map(Math.round);
  await assert.rejects(
    reserveUpload(db.client, "reel", 200 * MB),
    /Magazyn rolek jest prawie pełny/,
  );
  assert.equal(usageRow(), undefined, "R2 downloads are free — not counted");
});

test("per-file limits: ZIP 50 MB, image 10 MB, empty files refused", async () => {
  await assert.rejects(reserveUpload(db.client, "zip", 51 * MB), /limit to 50 MB/);
  await assert.rejects(reserveUpload(db.client, "image", 11 * MB), /limit to 10 MB/);
  await assert.rejects(reserveUpload(db.client, "image", 0), /Pusty plik/);
  await reserveUpload(db.client, "zip", 40 * MB);
  assert.equal(usageRow().bytes, 40 * MB);
});

test("Supabase storage is capped at 900 MB, summed through sub-folders", async () => {
  const big = Buffer.alloc(1); // the fake stores real buffers; sizes come from metadata
  db.storage["content/uploads/a.zip"] = Buffer.alloc(3 * MB);
  db.storage["content/c1/post-1.jpg"] = Buffer.alloc(2 * MB);
  db.storage["blog-images/cover.jpg"] = big;
  assert.equal(await supabaseStoredBytes(db.client), 5 * MB + 1);

  for (let i = 0; i < 9; i++) db.storage[`content/old/${i}.zip`] = Buffer.alloc(99 * MB);
  await assert.rejects(
    reserveUpload(db.client, "zip", 10 * MB),
    /Magazyn plików jest prawie pełny/,
  );
});

test("the monthly counter stops at 9 GB and starts over in a new month", async () => {
  await countTransfer(db.client, 8.5 * GB);
  await assert.rejects(countTransfer(db.client, 0.6 * GB), /Miesięczny limit transferu/);
  assert.equal((await monthlyUsage(db.client)).bytes, 8.5 * GB, "a refused transfer adds nothing");
  await countTransfer(db.client, 0.5 * GB);
  assert.equal((await monthlyUsage(db.client)).bytes, LIMITS.monthlyTransfer);

  usageRow().month = "2020-01";
  assert.deepEqual(await monthlyUsage(db.client), { month: currentMonth(), bytes: 0 });
  await countTransfer(db.client, 1 * GB);
  assert.equal(usageRow().bytes, 1 * GB);
});

test("months follow Polish time", () => {
  // 23:30 UTC on 31 Oct is already 1 Nov in Warsaw.
  assert.equal(currentMonth(new Date("2026-10-31T23:30:00Z")), "2026-11");
  assert.equal(currentMonth(new Date("2026-10-31T21:00:00Z")), "2026-10");
});
