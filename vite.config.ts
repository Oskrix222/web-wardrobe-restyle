// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Forwarded to nitro(): the plugin turns the Worker's cron trigger into a publisher run.
// The wrapper's types only list a few nitro options, but it passes the whole object on.
const nitro = { plugins: ["./src/server/cron-plugin.ts"] } as { preset?: string };

// Browser bundle: keep the framework (React + TanStack Router/Start) together. Rolldown's
// default splits it into ~15 tiny shared files, each preloaded on every page, and slow
// phones pay for every extra request (21 → 10 preloads on the home page; Lighthouse
// mobile, measured locally on the same build: 62 → 64).
const FRAMEWORK =
  /[\\/]node_modules[\\/](react|react-dom|scheduler|@tanstack|seroval|seroval-plugins|tiny-invariant|tiny-warning|cookie-es)[\\/]/;

const clientBundle = {
  output: { codeSplitting: { groups: [{ name: "framework", test: FRAMEWORK, priority: 20 }] } },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro,
  vite: {
    environments: {
      client: {
        // TanStack Start sets both names for the client build, so set both here too.
        build: { rollupOptions: clientBundle, rolldownOptions: clientBundle },
      },
    },
  },
});
