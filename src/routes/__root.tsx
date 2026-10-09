import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles/main.scss?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CookieConsent } from "../components/site/CookieConsent";
import { LiveChat } from "../components/site/LiveChat";
import { captureAttribution } from "../lib/attribution";

const GOOGLE_SITE_VERIFICATION = import.meta.env["VITE_GOOGLE_SITE_VERIFICATION"] as
  string | undefined;

function NotFoundComponent() {
  return (
    <div className="message-page">
      <div className="message-page__inner">
        <h1 className="message-page__code">404</h1>
        <h2 className="message-page__title">Strona nie znaleziona</h2>
        <p className="message-page__text">Szukana strona nie istnieje lub została przeniesiona.</p>
        <div className="message-page__actions">
          <Link to="/" className="btn btn--primary btn--md">
            Wróć na stronę główną
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="message-page">
      <div className="message-page__inner">
        <h1 className="message-page__title">Nie udało się załadować strony</h1>
        <p className="message-page__text">
          Coś poszło nie tak po naszej stronie. Spróbuj odświeżyć lub wróć na stronę główną.
        </p>
        <div className="message-page__actions">
          <button
            className="btn btn--primary btn--md"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Spróbuj ponownie
          </button>
          <a href="/" className="btn btn--outline btn--md">
            Wróć na stronę główną
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#f8f5ec" },
      { title: "OSCare Ubezpieczenia" },
      { name: "description", content: "Agent ubezpieczeniowy OSCare — Jaworzno i Katowice." },
      // Google Search Console ownership check — paste the code into .env (VITE_GOOGLE_SITE_VERIFICATION).
      ...(GOOGLE_SITE_VERIFICATION
        ? [{ name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION }]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Self-hosted fonts (src/styles/_fonts.scss); preload the two the first
      // screen needs so text doesn't reflow when they arrive.
      ...["manrope-latin-wght-normal", "anton-latin-400-normal"].map((file) => ({
        rel: "preload",
        href: `/fonts/${file}.woff2`,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous" as const,
      })),
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/imgs/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Remember how this visit started (utm_* tags, referrer) for the contact form.
  useEffect(() => {
    captureAttribution(window.location.href, document.referrer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <div className="scroll-progress" aria-hidden="true" />
      <Outlet />
      <Toaster position="top-center" />
      {/* Google Analytics / Ads load from here, and only after cookie consent. */}
      <CookieConsent />
      {/* Live chat with Oskar and Izumi — loads Crisp only when clicked. Hidden in the
          admin panel, where the bubble would cover its buttons. */}
      {pathname.startsWith("/admin") ? null : <LiveChat />}
    </QueryClientProvider>
  );
}
