import { createFileRoute } from "@tanstack/react-router";

// Called only by the Worker's cron (src/server/cron-plugin.ts). The token exists
// only in this isolate's memory, so requests from outside always get a 404.
export const Route = createFileRoute("/api/content/cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = (globalThis as { __oscareCronToken?: string }).__oscareCronToken;
        if (!token || request.headers.get("x-cron-token") !== token) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const { runPublisher } = await import("@/lib/content-publisher.server");
          return Response.json(await runPublisher());
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
