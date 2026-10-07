import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Signed in AND on the blog_admins list — the same gate as the rest of the panel.
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data } = await context.supabase.rpc("is_blog_admin");
    if (data !== true) throw new Error("Brak uprawnień do panelu.");
    return next();
  });

/** Which server keys are set (never their values) — shown in Panel → Połączenia. */
export const getServerSetup = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { metaAppConfigured } = await import("./meta-graph.server");
    return {
      serviceKey: Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]),
      metaApp: metaAppConfigured(),
    };
  });

/** Facebook login URL for connecting the Page + Instagram account. */
export const getMetaConnectUrl = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { buildConnectUrl } = await import("./meta-graph.server");
    return { url: await buildConnectUrl(new URL(getRequest().url).origin) };
  });

export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { createAdminClient } = await import("./supabase-admin.server");
    const { error } = await createAdminClient()
      .from("content_integrations")
      .delete()
      .eq("provider", "meta");
    if (error) throw new Error("Nie udało się rozłączyć konta.");
    return { ok: true };
  });

/** Publishes one approved item right away instead of waiting for its date. */
export const publishItemNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ itemId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { runPublisher } = await import("./content-publisher.server");
    return runPublisher({ itemId: data.itemId });
  });
