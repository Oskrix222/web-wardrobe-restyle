// Nitro plugin: Cloudflare Cron Trigger (wrangler.jsonc → triggers.crons) → content publisher.
// Forwards the scheduled event to the app's own /api/content/cron route with a one-off
// token, so the publisher runs inside the normal TanStack Start server.
import { definePlugin } from "nitro";
import { serverFetch, useNitroHooks } from "nitro/app";

type Hooks = { hook: (name: string, fn: () => Promise<void>) => void };

export default definePlugin(() => {
  (useNitroHooks() as unknown as Hooks).hook("cloudflare:scheduled", async () => {
    const token = crypto.randomUUID();
    (globalThis as { __oscareCronToken?: string }).__oscareCronToken = token;
    try {
      const res = await serverFetch("https://cron.internal/api/content/cron", {
        method: "POST",
        headers: { "x-cron-token": token },
      });
      console.log(`[content-cron] ${res.status} ${await res.text()}`);
    } finally {
      // One run, one token: nothing valid stays in memory between runs.
      delete (globalThis as { __oscareCronToken?: string }).__oscareCronToken;
    }
  });
});
