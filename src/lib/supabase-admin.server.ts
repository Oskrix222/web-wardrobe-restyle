// Service-role Supabase client for trusted server code (content publisher, Meta OAuth).
// It bypasses RLS, so only import it dynamically from server handlers.
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

// New-style keys (sb_secret_…) are not JWTs: send them only as `apikey`.
function apiKeyFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    if (init?.headers) new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export function createAdminClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Brak klucza SUPABASE_SERVICE_ROLE_KEY w ustawieniach serwera (Cloudflare → Worker → Settings → Variables and Secrets).",
    );
  }
  return createClient<Database>(url, key, {
    global: { fetch: apiKeyFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
