import { createMiddleware } from "@tanstack/react-start";

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
//
// Only the admin panel signs in, so supabase-js (~100 KB gzipped) is loaded only
// there — visitors' server calls (form, blog counters) go out without a token.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined" || !window.location.pathname.startsWith("/admin")) {
      return next();
    }
    const { supabase } = await import("./client");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
