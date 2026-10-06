import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LoaderCircle, MessageCircle, Phone, X } from "lucide-react";

declare global {
  interface Window {
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>;
  }
}

/** Website ID from Crisp → Settings → Website Settings → Setup & Integrations. */
const CRISP_WEBSITE_ID = import.meta.env["VITE_CRISP_WEBSITE_ID"] as string | undefined;
/** Ad blockers often block Crisp silently; give up waiting after this long. */
const LOAD_TIMEOUT_MS = 10_000;

type ChatState = "idle" | "loading" | "loaded" | "failed";
type ChatMode = "widget" | "embed";

let crispPromise: Promise<void> | null = null;

/** Injects Crisp once; rejects if the script is blocked or never arrives. */
function loadCrisp(): Promise<void> {
  if (crispPromise) return crispPromise;
  crispPromise = new Promise<void>((resolve, reject) => {
    window.$crisp = window.$crisp ?? [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID ?? "";
    window.CRISP_RUNTIME_CONFIG = { locale: "pl" };
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    const timer = window.setTimeout(() => reject(new Error("timeout")), LOAD_TIMEOUT_MS);
    script.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("blocked"));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    crispPromise = null; // allow a retry on the next click
    throw error;
  });
  return crispPromise;
}

/**
 * Crisp's relay refuses connections from Cloudflare's free hostnames
 * (*.workers.dev, *.pages.dev), so the normal widget would spin forever there.
 * On those hosts we show Crisp's own hosted chat page in an iframe instead —
 * same inbox, same apps — and the real widget takes over on a proper domain.
 */
function widgetBlockedHere(): boolean {
  return /\.(workers|pages)\.dev$/.test(window.location.hostname);
}

const EMBED_URL = `https://go.crisp.chat/chat/embed/?website_id=${CRISP_WEBSITE_ID ?? ""}`;

/** A visitor who already chatted gets Crisp straight away, so they see our replies. */
function hasCrispSession(): boolean {
  return /crisp-client/.test(document.cookie);
}

function openCrisp() {
  window.$crisp = window.$crisp ?? [];
  window.$crisp.push(["do", "chat:show"]);
  window.$crisp.push(["do", "chat:open"]);
}

/**
 * Live chat with Oskar and Izumi (Crisp — real people, no bot). Crisp only
 * loads when the visitor clicks our button, so it sets no cookies and costs no
 * page speed for anyone who doesn't use it. If it can't load (usually an ad
 * blocker), the visitor gets phone / contact-form fallbacks instead of a dead
 * button. Hidden in the admin panel.
 */
export function LiveChat() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  const [state, setState] = useState<ChatState>("idle");
  // Decided after mount: the server render can't see the hostname.
  const [mode, setMode] = useState<ChatMode | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return;
    if (widgetBlockedHere()) {
      setMode("embed");
      return;
    }
    setMode("widget");
    if (!hasCrispSession()) return;
    loadCrisp().then(
      () => setState("loaded"),
      () => setState("idle"),
    );
  }, []);

  // Crisp's own launcher replaces ours once loaded; keep it out of the panel.
  useEffect(() => {
    if (state !== "loaded") return;
    window.$crisp?.push(["do", isAdmin ? "chat:hide" : "chat:show"]);
  }, [state, isAdmin]);

  if (!CRISP_WEBSITE_ID || !mode || isAdmin || state === "loaded") return null;

  if (mode === "embed") {
    return (
      <>
        {embedOpen ? (
          <div className="live-chat-embed" role="dialog" aria-label="Czat z doradcą">
            <button
              type="button"
              className="live-chat-embed__close"
              onClick={() => setEmbedOpen(false)}
              aria-label="Zamknij czat"
            >
              <X aria-hidden="true" />
            </button>
            <iframe
              src={EMBED_URL}
              title="Czat z doradcą OSCare"
              className="live-chat-embed__frame"
            />
          </div>
        ) : null}
        <button
          type="button"
          className="live-chat"
          onClick={() => setEmbedOpen((o) => !o)}
          aria-expanded={embedOpen}
          aria-label={embedOpen ? "Zamknij czat" : "Otwórz czat z doradcą"}
        >
          {embedOpen ? (
            <X className="live-chat__icon" aria-hidden="true" />
          ) : (
            <MessageCircle className="live-chat__icon" aria-hidden="true" />
          )}
          <span className="live-chat__label">{embedOpen ? "Zamknij" : "Napisz do nas"}</span>
        </button>
      </>
    );
  }

  const open = () => {
    setState("loading");
    loadCrisp().then(
      () => {
        openCrisp();
        setState("loaded");
      },
      () => setState("failed"),
    );
  };

  return (
    <>
      {state === "failed" ? (
        <div className="live-chat-fallback" role="alert">
          <button
            type="button"
            className="live-chat-fallback__close"
            onClick={() => setState("idle")}
            aria-label="Zamknij"
          >
            <X aria-hidden="true" />
          </button>
          <p className="live-chat-fallback__title">Czat nie mógł się otworzyć</p>
          <p className="live-chat-fallback__text">
            Najczęściej blokuje go wtyczka do blokowania reklam. Wyłącz ją dla tej strony i spróbuj
            ponownie — albo skontaktuj się z nami od razu:
          </p>
          <div className="live-chat-fallback__actions">
            <a href="tel:+48539075385" className="btn btn--primary btn--sm">
              <Phone className="btn__icon" aria-hidden="true" />
              539 075 385
            </a>
            <a
              href="/#kontakt"
              className="btn btn--outline btn--sm"
              onClick={() => setState("idle")}
            >
              Zostaw kontakt
            </a>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="live-chat"
        onClick={open}
        disabled={state === "loading"}
        aria-label="Otwórz czat z doradcą"
      >
        {state === "loading" ? (
          <LoaderCircle className="live-chat__icon live-chat__icon--spin" aria-hidden="true" />
        ) : (
          <MessageCircle className="live-chat__icon" aria-hidden="true" />
        )}
        <span className="live-chat__label">Napisz do nas</span>
      </button>
    </>
  );
}
