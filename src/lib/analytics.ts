// GA4 + Google Ads via one gtag.js. Nothing Google-related loads until the
// visitor accepts cookies in the consent banner (EU / RODO requirement).
// Every helper is safe to call when tracking isn't configured or not
// consented yet — it just no-ops.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined;
/** "AW-1234567890" from Google Ads → Cele → Konwersje. */
export const GOOGLE_ADS_ID = import.meta.env["VITE_GOOGLE_ADS_ID"] as string | undefined;
/** Conversion label of the "Lead" action, e.g. "AbC-D_efG-h12_34-567". */
const GOOGLE_ADS_LEAD_LABEL = import.meta.env["VITE_GOOGLE_ADS_LEAD_LABEL"] as string | undefined;

const TRACKING_IDS = [GA_MEASUREMENT_ID, GOOGLE_ADS_ID].filter(Boolean) as string[];

/** True when at least one Google tag is configured — only then is a consent banner needed. */
export const trackingConfigured = TRACKING_IDS.length > 0;

export type Consent = "granted" | "denied";
const CONSENT_KEY = "oscare-cookie-consent";
const CONSENT_EVENT = "oscare:consent-reset";

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private mode etc. — the choice just won't be remembered.
  }
  if (value === "granted") {
    loadGoogleTags();
  } else if (typeof window.gtag === "function") {
    // Consent withdrawn mid-visit: stop Google storing anything from now on.
    window.gtag("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

/** Forgets the stored choice and re-opens the banner ("Ustawienia cookies" in the footer). */
export function resetConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function onConsentReset(listener: () => void) {
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}

let loaded = false;

/** Injects gtag.js once; only ever called after the visitor granted consent. */
export function loadGoogleTags() {
  if (loaded || typeof window === "undefined" || !trackingConfigured) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the Arguments object itself, not an array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
  window.gtag("js", new Date());
  for (const id of TRACKING_IDS) window.gtag("config", id);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING_IDS[0]}`;
  document.head.appendChild(script);
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Reports a lead to GA4 (generate_lead) and, if configured, as a Google Ads conversion. */
export function trackLead(params: Record<string, unknown>) {
  trackEvent("generate_lead", params);
  if (GOOGLE_ADS_ID && GOOGLE_ADS_LEAD_LABEL) {
    trackEvent("conversion", { send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}` });
  }
}
