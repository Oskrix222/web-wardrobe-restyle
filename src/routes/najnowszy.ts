import { createFileRoute } from "@tanstack/react-router";

// Fixed "link in bio": always redirects to the newest published blog post.
export const Route = createFileRoute("/najnowszy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("blog_posts")
          .select("slug")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const url = new URL(request.url);
        // Keep ?utm_… so analytics still sees where the visit came from.
        const target = new URL(data ? `/blog/${data.slug}` : "/blog", url.origin);
        target.search = url.search;
        return Response.redirect(target.toString(), 302);
      },
    },
  },
});
