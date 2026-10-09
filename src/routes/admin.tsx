import { createFileRoute, Outlet } from "@tanstack/react-router";

import adminCss from "../styles/admin.scss?url";

// Parent of every /admin/* page: loads the panel's stylesheet (kept out of the
// visitors' main.css) and keeps the whole panel out of search results.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: Outlet,
});
