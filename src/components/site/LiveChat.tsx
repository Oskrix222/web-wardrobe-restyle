import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { LoaderCircle, MessageCircle } from "lucide-react";

declare global {
  interface Window {
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>;
  }
}

/** Website ID from Crisp → Settings → Website Settings → Setup & Integrations. */
const CRISP_WEBSITE_ID = import.meta.env["VITE_CRISP_WEBSITE_ID"] as string | undefined;

let crispRequested = false;

/** Injects Crisp once. Anything pushed onto $crisp before it loads is queued. */
function loadCrisp(onLoad: () => void) {
  if (crispRequested || !CRISP_WEBSITE_ID) return;
  crispRequested = true;
  window.$crisp = window.$crisp ?? [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
  window.CRISP_RUNTIME_CONFIG = { locale: "pl" };
  const script = document.createElement("script");
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;
  script.onload = onLoad;
  document.head.appendChild(script);
}

/** A visitor who already chatted gets Crisp straight away, so they see our replies. */
function hasCrispSession(): boolean {
  return /crisp-client/.test(document.cookie);
}

/**
 * Live chat with Oskar and Izumi (Crisp — real people, no bot). Crisp only
 * loads when the visitor clicks our button, so it sets no cookies and costs no
 * page speed for anyone who doesn't use it. Hidden in the admin panel.
 */
export function LiveChat() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  const [state, setState] = useState<"idle" | "loading" | "loaded">("idle");

  useEffect(() => {
    if (CRISP_WEBSITE_ID && hasCrispSession()) {
      setState("loading");
      loadCrisp(() => setState("loaded"));
    }
  }, []);

  // Crisp's own launcher replaces ours once loaded; keep it out of the panel.
  useEffect(() => {
    if (state !== "loaded") return;
    window.$crisp?.push(["do", isAdmin ? "chat:hide" : "chat:show"]);
  }, [state, isAdmin]);

  if (!CRISP_WEBSITE_ID || isAdmin || state === "loaded") return null;

  const open = () => {
    setState("loading");
    window.$crisp = window.$crisp ?? [];
    window.$crisp.push(["do", "chat:open"]);
    loadCrisp(() => setState("loaded"));
  };

  return (
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
  );
}
