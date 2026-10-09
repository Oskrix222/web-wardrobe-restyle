import { createFileRoute } from "@tanstack/react-router";

import { buildSitemap } from "@/lib/sitemap";

// /sitemap.xml — every page Google should index (built in src/lib/sitemap.ts).

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("blog_posts")
          .select("slug, updated_at, published_at")
          .eq("status", "published")
          .order("published_at", { ascending: false });
        return new Response(buildSitemap(data ?? []), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
