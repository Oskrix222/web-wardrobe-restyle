// The database setup the admin pastes into Supabase (supabase/setup.sql), run on a
// real Postgres (PGlite) with stand-ins for Supabase's auth/storage schemas.
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const SETUP = readFileSync(new URL("../../supabase/setup.sql", import.meta.url), "utf8");
const PANEL_SQL = ["20261008090000_content_calendar.sql", "20261008120000_content_settings.sql"]
  .map((f) => readFileSync(new URL(`../../supabase/migrations/${f}`, import.meta.url), "utf8"))
  .join("\n\n");

// What Supabase provides out of the box, reduced to what the migrations touch.
const SUPABASE_STUBS = `
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
CREATE SCHEMA storage;
CREATE TABLE storage.buckets (
  id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[]
);
CREATE TABLE storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets (id), name text
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated;
`;

let pg;

/** Runs `sql` as a Supabase API role, optionally as a signed-in user with this e-mail. */
async function as(role, email, sql, params) {
  await pg.exec(`SET ROLE ${role}`);
  await pg.query("SELECT set_config('request.jwt.claims', $1, false)", [
    JSON.stringify(email ? { email, role } : { role }),
  ]);
  try {
    return await pg.query(sql, params);
  } finally {
    await pg.exec("RESET ROLE");
  }
}

before(async () => {
  pg = new PGlite();
  await pg.exec(SUPABASE_STUBS);
});

test("setup.sql runs on a fresh project, and again without errors", async () => {
  await pg.exec(SETUP);
  await pg.exec(SETUP);
  // What the panel's "Kopiuj SQL" button pastes, on top of an existing setup.
  await pg.exec(PANEL_SQL);

  const tables = await pg.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'content_%' ORDER BY 1",
  );
  assert.deepEqual(
    tables.rows.map((r) => r.table_name),
    [
      "content_campaigns",
      "content_integrations",
      "content_items",
      "content_replies",
      "content_settings",
      "content_truths",
      "content_uploads",
    ],
  );
});

test("defaults are seeded once: week plan, authors, auto replies, the two truths", async () => {
  const settings = await pg.query("SELECT key, value FROM content_settings ORDER BY key");
  assert.deepEqual(
    settings.rows.map((r) => r.key),
    ["authors", "auto_reply", "schedule"],
  );
  const schedule = settings.rows.find((r) => r.key === "schedule").value;
  assert.equal(schedule.reels.length, 3);
  const authors = settings.rows.find((r) => r.key === "authors").value;
  assert.deepEqual(
    authors.map((a) => a.name),
    ["Oskar Kubowicz", "Izumi Sato"],
  );
  const truths = await pg.query("SELECT category FROM content_truths ORDER BY category");
  assert.deepEqual(
    truths.rows.map((r) => r.category),
    ["oferta", "ograniczenie"],
  );
  const bucket = await pg.query(
    "SELECT allowed_mime_types FROM storage.buckets WHERE id = 'content'",
  );
  assert.ok(bucket.rows[0].allowed_mime_types.includes("application/zip"));
});

test("an allow-listed admin manages content; other signed-in users see nothing", async () => {
  const admin = "kubowiczoskar@gmail.com";
  await as(
    "authenticated",
    admin,
    "INSERT INTO content_truths (body, category) VALUES ('W branży od 2005.', 'o_nas')",
  );
  const mine = await as("authenticated", admin, "SELECT count(*)::int AS n FROM content_truths");
  assert.equal(mine.rows[0].n, 3);

  const stranger = await as(
    "authenticated",
    "obcy@example.com",
    "SELECT count(*)::int AS n FROM content_truths",
  );
  assert.equal(stranger.rows[0].n, 0);
  await assert.rejects(
    as("authenticated", "obcy@example.com", "INSERT INTO content_truths (body) VALUES ('hack')"),
    /row-level security/,
  );
  await assert.rejects(as("anon", null, "SELECT * FROM content_items"), /permission denied/);
});

test("Meta tokens are never readable from the browser; admins get a token-free status", async () => {
  await pg.exec(
    `INSERT INTO content_integrations (provider, data) VALUES
     ('meta', '{"pageName":"OSCare","igUsername":"oscare","pageToken":"SECRET"}')`,
  );
  await assert.rejects(
    as("authenticated", "kubowiczoskar@gmail.com", "SELECT * FROM content_integrations"),
    /permission denied/,
  );
  const status = await as(
    "authenticated",
    "kubowiczoskar@gmail.com",
    "SELECT content_connection_status() AS s",
  );
  assert.equal(status.rows[0].s.meta.pageName, "OSCare");
  assert.ok(!JSON.stringify(status.rows[0].s).includes("SECRET"));
  const strangerStatus = await as(
    "authenticated",
    "obcy@example.com",
    "SELECT content_connection_status() AS s",
  );
  assert.equal(strangerStatus.rows[0].s, null);
});

test("data rules: valid categories/kinds only, one item per slot, one reply per comment", async () => {
  await assert.rejects(
    pg.query("INSERT INTO content_truths (body, category) VALUES ('x', 'inne')"),
    /check/,
  );
  await assert.rejects(pg.query("INSERT INTO content_truths (body) VALUES ('   ')"), /check/);
  const campaign = await pg.query(
    "INSERT INTO content_campaigns (folder, title, week_start) VALUES ('t', 'T', '2026-10-12') RETURNING id",
  );
  const id = campaign.rows[0].id;
  const insert = (kind, position) =>
    pg.query(
      "INSERT INTO content_items (campaign_id, kind, position, title, scheduled_at) VALUES ($1, $2, $3, 'x', now())",
      [id, kind, position],
    );
  await insert("reel", 1);
  await assert.rejects(insert("reel", 1), /duplicate key/);
  await assert.rejects(insert("tiktok", 0), /check/);

  const row = await pg.query("SELECT first_comment, channels, status FROM content_items LIMIT 1");
  assert.deepEqual(row.rows[0], { first_comment: "", channels: ["instagram"], status: "pending" });

  await pg.query("INSERT INTO content_replies (platform, comment_id) VALUES ('instagram', 'c1')");
  await assert.rejects(
    pg.query("INSERT INTO content_replies (platform, comment_id) VALUES ('instagram', 'c1')"),
    /duplicate key/,
  );
  // Deleting a campaign removes its items.
  await pg.query("DELETE FROM content_campaigns WHERE id = $1", [id]);
  const left = await pg.query(
    "SELECT count(*)::int AS n FROM content_items WHERE campaign_id = $1",
    [id],
  );
  assert.equal(left.rows[0].n, 0);
});
