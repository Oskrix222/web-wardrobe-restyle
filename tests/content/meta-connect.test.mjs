// Facebook login for Panel → Połączenia: requested permissions, the signed state,
// and what gets stored after a successful login.
import { beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";

import { createFakeSupabase } from "./fake-supabase.mjs";

let db;
mock.module("@/lib/supabase-admin.server", {
  namedExports: { createAdminClient: () => db.client },
});
Object.assign(process.env, { META_APP_ID: "123", META_APP_SECRET: "app-secret" });
const { buildConnectUrl, handleMetaCallback } = await import("@/lib/meta-graph.server");

const ORIGIN = "https://oscare.example";
const scopesOf = (url) => new URL(url).searchParams.get("scope").split(",");

beforeEach(() => {
  db = createFakeSupabase();
});

test("the main login asks only for publishing + comments; messaging is opt-in", async () => {
  const basic = scopesOf(await buildConnectUrl(ORIGIN));
  assert.ok(basic.includes("instagram_content_publish"));
  assert.ok(basic.includes("pages_manage_posts"));
  assert.ok(basic.includes("instagram_manage_comments"));
  assert.ok(!basic.includes("pages_messaging"));
  assert.ok(!basic.includes("instagram_manage_messages"));

  const withMessages = scopesOf(await buildConnectUrl(ORIGIN, { messaging: true }));
  assert.ok(withMessages.includes("pages_messaging"));
  assert.ok(withMessages.includes("instagram_manage_messages"));

  const url = new URL(await buildConnectUrl(ORIGIN));
  assert.equal(url.searchParams.get("redirect_uri"), `${ORIGIN}/api/meta/callback`);
  assert.equal(url.searchParams.get("client_id"), "123");
});

test("a forged or missing state is rejected before talking to Facebook", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return Response.json({});
  };
  const forged = await handleMetaCallback(
    new Request(`${ORIGIN}/api/meta/callback?code=abc&state=xyz.abc`),
  );
  assert.equal(forged.status, 302);
  assert.match(decodeURIComponent(forged.headers.get("location")), /meta=link wygasł/);
  const cancelled = await handleMetaCallback(
    new Request(`${ORIGIN}/api/meta/callback?error_description=Anulowano`),
  );
  assert.match(decodeURIComponent(cancelled.headers.get("location")), /meta=Anulowano/);
  assert.equal(called, false);
});

test("a valid login stores the Page token next to the Instagram account", async () => {
  const state = new URL(await buildConnectUrl(ORIGIN)).searchParams.get("state");
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url.pathname + url.search);
    if (url.pathname.endsWith("/oauth/access_token")) {
      return Response.json({ access_token: url.searchParams.has("code") ? "short" : "long-lived" });
    }
    if (url.pathname.endsWith("/me/accounts")) {
      return Response.json({
        data: [
          { id: "P0", name: "Prywatna strona", access_token: "t0" },
          {
            id: "P1",
            name: "OSCare",
            access_token: "page-token",
            instagram_business_account: { id: "IG1", username: "oscare" },
          },
        ],
      });
    }
    return Response.json({ error: { message: "unexpected" } }, { status: 400 });
  };
  const res = await handleMetaCallback(
    new Request(`${ORIGIN}/api/meta/callback?code=the-code&state=${state}`),
  );
  assert.match(res.headers.get("location"), /meta=ok/);
  const stored = db.tables.content_integrations.find((r) => r.provider === "meta").data;
  assert.equal(stored.pageId, "P1", "picks the Page that has Instagram");
  assert.equal(stored.pageToken, "page-token");
  assert.equal(stored.igUserId, "IG1");
  assert.ok(
    calls.some((c) => c.includes("fb_exchange_token=short")),
    "short token exchanged for a long-lived one",
  );
});

test("a Page without a business Instagram account gives a clear message", async () => {
  const state = new URL(await buildConnectUrl(ORIGIN)).searchParams.get("state");
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/me/accounts")) {
      return Response.json({ data: [{ id: "P0", name: "OSCare", access_token: "t" }] });
    }
    return Response.json({ access_token: "x" });
  };
  const res = await handleMetaCallback(
    new Request(`${ORIGIN}/api/meta/callback?code=c&state=${state}`),
  );
  assert.match(
    decodeURIComponent(res.headers.get("location")),
    /nie ma podpiętego konta firmowego na Instagramie/,
  );
  assert.equal(db.tables.content_integrations, undefined, "nothing stored");
});
