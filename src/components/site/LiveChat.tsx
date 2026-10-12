import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LoaderCircle, MessageCircle, Phone, X } from "lucide-react";
import { PRIMARY_PHONE, telHref } from "@/config/business";
import { cn } from "@/lib/utils";

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

const TEASER_KEY = "oscare-chat-teaser-dismissed";
/** Shown once per visit: after it hides by itself it doesn't come back on the next page. */
const TEASER_SEEN_KEY = "oscare-chat-teaser-seen";
const TEASER_DELAY_MS = 2_000;
/** How long the bubble stays before it slides away by itself (paused on hover/focus). */
const TEASER_VISIBLE_MS = 5_000;
const TEASER_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function teaserSnoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(TEASER_KEY));
    return Boolean(at) && Date.now() - at < TEASER_SNOOZE_MS;
  } catch {
    return false;
  }
}

function teaserSeenThisVisit(): boolean {
  try {
    return sessionStorage.getItem(TEASER_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markTeaserSeen() {
  try {
    sessionStorage.setItem(TEASER_SEEN_KEY, "1");
  } catch {
    // Private mode etc. — worst case it shows again on the next page.
  }
}

function snoozeTeaser() {
  try {
    localStorage.setItem(TEASER_KEY, String(Date.now()));
  } catch {
    // Private mode etc. — the teaser may just show again next visit.
  }
}

const warsawClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw",
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});

/** Mon–Fri 9–19, Sat 9–14 (Warsaw) — the hours listed in the footer. */
function withinOfficeHours(now = new Date()): boolean {
  const parts = warsawClock.formatToParts(now);
  const day = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  if (day === "Sun") return false;
  if (day === "Sat") return hour >= 9 && hour < 14;
  return hour >= 9 && hour < 19;
}

/**
 * "Real people, we usually reply instantly" bubble above the launcher. It
 * slides in, stays TEASER_VISIBLE_MS (a thin bar counts down; hovering or
 * focusing it pauses the count) and then slides away by itself. The countdown
 * is the bar's CSS animation, so pausing it pauses the timer too.
 */
function ChatTeaser({
  online,
  onOpen,
  onClose,
  onTimeout,
}: {
  online: boolean;
  onOpen: () => void;
  onClose: () => void;
  onTimeout: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  // Why it's leaving: the visitor closed it (snooze for a week) or time ran out.
  const closedByVisitor = useRef(false);

  return (
    <div
      className={cn("chat-teaser", leaving && "is-leaving")}
      role="status"
      style={{ "--teaser-time": `${TEASER_VISIBLE_MS}ms` } as CSSProperties}
      onAnimationEnd={(event) => {
        if (!leaving || event.target !== event.currentTarget) return;
        if (closedByVisitor.current) onClose();
        else onTimeout();
      }}
    >
      <button
        type="button"
        className="chat-teaser__close"
        onClick={() => {
          closedByVisitor.current = true;
          setLeaving(true);
        }}
        aria-label="Zamknij powiadomienie"
      >
        <X aria-hidden="true" />
      </button>
      <button type="button" className="chat-teaser__body" onClick={onOpen}>
        <span className="chat-teaser__avatars" aria-hidden="true">
          <span>O</span>
          <span>I</span>
          {online ? <i className="chat-teaser__online" /> : null}
        </span>
        <span className="chat-teaser__title">Piszesz z człowiekiem, nie z AI</span>
        <span className="chat-teaser__text">Najczęściej odpisujemy natychmiastowo.</span>
      </button>
      <span
        className="chat-teaser__timer"
        aria-hidden="true"
        onAnimationEnd={(event) => {
          event.stopPropagation();
          setLeaving(true);
        }}
      />
    </div>
  );
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
  const [teaser, setTeaser] = useState<"online" | "offline" | null>(null);

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

  // Two seconds in, tell visitors the chat is staffed by people — once per
  // visit, not while the cookie banner is up, not for a week once closed.
  useEffect(() => {
    if (!mode || teaserSnoozed() || teaserSeenThisVisit()) return;
    const timer = window.setTimeout(() => {
      if (document.querySelector(".cookie-consent")) return;
      markTeaserSeen();
      setTeaser(withinOfficeHours() ? "online" : "offline");
    }, TEASER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [mode]);

  const dismissTeaser = () => {
    setTeaser(null);
    snoozeTeaser();
  };

  // Crisp's own launcher replaces ours once loaded; keep it out of the panel.
  useEffect(() => {
    if (state !== "loaded") return;
    window.$crisp?.push(["do", isAdmin ? "chat:hide" : "chat:show"]);
  }, [state, isAdmin]);

  if (!CRISP_WEBSITE_ID || !mode || isAdmin || state === "loaded") return null;

  const teaserBubble = (onOpen: () => void) =>
    teaser ? (
      <ChatTeaser
        online={teaser === "online"}
        onClose={dismissTeaser}
        onTimeout={() => setTeaser(null)}
        onOpen={() => {
          dismissTeaser();
          onOpen();
        }}
      />
    ) : null;

  if (mode === "embed") {
    return (
      <>
        {embedOpen ? null : teaserBubble(() => setEmbedOpen(true))}
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
          onClick={() => {
            if (teaser) dismissTeaser();
            setEmbedOpen((o) => !o);
          }}
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
    if (teaser) dismissTeaser();
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
      {state === "idle" ? teaserBubble(open) : null}
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
            <a href={telHref(PRIMARY_PHONE)} className="btn btn--primary btn--sm">
              <Phone className="btn__icon" aria-hidden="true" />
              {PRIMARY_PHONE.replace("+48 ", "")}
            </a>
            <a
              href="/#kontakt"
              className="btn btn--outline btn--sm btn--contact"
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
