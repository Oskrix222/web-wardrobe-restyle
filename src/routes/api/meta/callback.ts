import { createFileRoute } from "@tanstack/react-router";

// Facebook Login redirects here after "Połącz" in Panel → Połączenia.
export const Route = createFileRoute("/api/meta/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleMetaCallback } = await import("@/lib/meta-graph.server");
        return handleMetaCallback(request);
      },
    },
  },
});
