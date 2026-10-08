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
    const { r2Configured } = await import("./r2.server");
    return {
      serviceKey: Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]),
      metaApp: metaAppConfigured(),
      r2: r2Configured(),
    };
  });

/** Facebook login URL for connecting the Page + Instagram account. */
export const getMetaConnectUrl = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ messaging: z.boolean().optional() }).optional())
  .handler(async ({ data }) => {
    const { buildConnectUrl } = await import("./meta-graph.server");
    return {
      url: await buildConnectUrl(new URL(getRequest().url).origin, {
        messaging: data?.messaging ?? false,
      }),
    };
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

/**
 * Where the browser should upload a reel: a presigned R2 URL (big files, free 10 GB),
 * or null when R2 isn't set up yet — then the panel falls back to Supabase (50 MB).
 * Refuses files that would break a limit (usage-guard.server.ts).
 */
export const getVideoUploadTarget = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    z.object({
      itemId: z.string().uuid(),
      extension: z.string().regex(/^[a-z0-9]{2,5}$/),
      size: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const { reserveUpload } = await import("./usage-guard.server");
    const { createAdminClient } = await import("./supabase-admin.server");
    const { store } = await reserveUpload(createAdminClient(), "reel", data.size);
    if (store !== "r2") return null;
    const { r2PublicUrl, r2UploadUrl } = await import("./r2.server");
    const key = `rolki/${data.itemId}-${Date.now()}.${data.extension}`;
    return { key, uploadUrl: await r2UploadUrl(key), publicUrl: r2PublicUrl(key) };
  });

/** Checks a ZIP or image against the limits (and counts it) before the browser uploads it. */
export const reserveFileUpload = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ kind: z.enum(["zip", "image"]), size: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const { reserveUpload } = await import("./usage-guard.server");
    const { createAdminClient } = await import("./supabase-admin.server");
    await reserveUpload(createAdminClient(), data.kind, data.size);
    return { ok: true };
  });

/** Transfer this month + stored files, for Panel → Połączenia. */
export const getUsage = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { usageSummary } = await import("./usage-guard.server");
    const { createAdminClient } = await import("./supabase-admin.server");
    return usageSummary(createAdminClient());
  });

export const deleteR2Video = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(z.object({ key: z.string().startsWith("rolki/") }))
  .handler(async ({ data }) => {
    const { r2Delete } = await import("./r2.server");
    await r2Delete(data.key);
    return { ok: true };
  });
