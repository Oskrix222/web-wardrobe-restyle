import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles/main.scss?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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
      { title: "KAMIEŃ — Ubezpieczenia" },
      { name: "description", content: "Doradztwo ubezpieczeniowe KAMIEŃ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
